# ProjectOS — Proposed REST contracts
Design only; no endpoint is implemented. API prefix /api/v1. Permission codes are defined in [requirements](requirements.md).

## Common contract rules
In the tables T = /tenants/{tenantId}; P = T/projects/{projectId}. Tenant scope “T” means authenticated active user, active tenant and verified active Membership on every call; “P” adds resource-level project access. This applies to nested IDs, referenced IDs, list filters and jobs, not just the URL parent.
Global identity endpoints require session except login/callback and probes. Invitation acceptance is an explicit bootstrap exception: session + verified email + valid tenant invitation; existing membership cannot be required before accepting. Tenant creation similarly creates first Owner atomically.

R = read only; W = changes state; Q = creates a stored job/result. No GET starts a simulation, policy evaluation or AI call. All authenticated results are private/no-store.
Every table row inherits:
- Errors: 400 malformed request, 401 invalid/expired session, 403 action denied/CSRF, 404 hidden or missing resource, 422 schema/semantic failure, 429 rate limit, 500 unexpected. W/Q adds 409 conflict/idempotency mismatch and 503 dependency unavailable. Probes/login have specified exceptions.
- Successful entity response is {data: DTO, requestId}; list is {data: DTO[], page:{nextCursor:string|null}, requestId}. 204 has no body.
- Content-Type application/json except OIDC redirects; strict object schemas reject unknown fields, including client tenantId/actorId/status fields not declared.
- IDs UUID; timestamps UTC ISO-8601; dates YYYY-MM-DD in project calendar; string names 1..120, description ≤4,000, comments ≤10,000; body ≤128 KiB except bounded snapshots assembled server-side.
- List query L = {limit?:integer 1..100 default 25, cursor?:opaque string ≤2,048}. Sort stable createdAt,id descending. Signed cursor binds tenant, actor visibility, filters and sort, expires after 24 h; changed membership still rechecked. No total count by default.
- Required Idempotency-Key UUID for all POST mutations except auth redirects; scoped tenant+actor+route, stored 24 h. Same key/body returns original result; different body 409. Proposal executed-state protection persists beyond idempotency TTL.
- Mutable PATCH requires If-Match revision returned as ETag; missing 428, mismatch 409. Immutable action POSTs declare expectedRevision or bound payloadHash where needed.
- Error body: {error:{code:string,message:string,details?:[{path:string,code:string}],requestId:string}}. Never disclose foreign-tenant IDs, SQL, prompts, stack or credentials. Codes include VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, STALE_REVISION, DEPENDENCY_CYCLE, APPROVAL_REQUIRED, APPROVAL_EXPIRED, CONFLICT, AI_UNAVAILABLE.
- Version 1 additive optional fields are compatible; removed fields/changed semantics require v2 and documented deprecation. DTO schema catalogue below and endpoint table together form the contract.

## Shared DTO and request schemas
“?” marks optional, “|null” explicitly permits null. Unknown properties rejected. UUID/date/timestamp/name types follow rules above.
- UserContext: {id,displayName,emailVerified:boolean,memberships:[{id,tenantId,tenantName,orgRole}],platformRoles:string[]}. No other users' memberships.
- Tenant: {id,name,slug,timezone,status:active|suspended|archived,revision}.
- Member: {id,user:{id,displayName},orgRole:Owner|Admin|Member,status:active|suspended,revision}. Email only to authorized membership managers.
- Invitation: {id,email,orgRole:Admin|Member,status:pending|accepted|revoked|expired,expiresAt}; create returns one-use acceptanceLink once, never token hash.
- Project: {id,name,description,status:active|archived,startDate,targetDate:date|null,capacityUnits:int,planRevision:int,revision:int}.
- ProjectMember: {id,membershipId,projectRole:ProjectManager|TeamMember|Viewer,revision}.
- Milestone: {id,name,targetDate:date|null,critical:boolean,revision}.
- Task: {id,title,status:todo|inProgress|blocked|done,assigneeMembershipId:UUID|null,milestoneId:UUID|null,priority:low|normal|high|critical,remainingEffortDays:int,resourceUnits:int,releaseOffset:int,actualFinishOffset:int|null,progressPercent:int,revision}.
- Dependency: {id,predecessorTaskId,successorTaskId,type:"FS"}.
- Comment: {id,taskId,authorMembershipId,body,createdAt,editedAt:timestamp|null,revision}.
- Notification: {id,kind,summary,projectId:UUID|null,createdAt,readAt:timestamp|null,revision}; revoked target gives redacted summary with no link.
- Policy: {id,name,status:draft|active|disabled,activeVersionId:UUID|null,revision}.
- PolicyVersion: {id,policyId,versionNumber,definition:PolicyDefinition,definitionHash,validation:ValidationReport,publishedAt:timestamp|null}; PolicyDefinition and exact bounds in [policy engine](policy-engine.md).
- ValidationReport: {valid:boolean,errors:[{path,code,message}],warnings:[{path,code,message}],definitionHash:string}.
- WorkflowExecution: {id,policyVersionId,eventId,state,matchedFacts:[{factId,value}],proposalId:UUID|null,errorCode:string|null,createdAt}.
- ScheduleResult: {completionOffset:int,completionDate:date,milestones:[{id,offset:int|null,date:date|null,latenessDays:int|null}],tasks:[{id,start:int,finish:int,precedenceSlack:int}],capacityConflicts:[],assumptions:string[]}.
- Simulation: {id,status:queued|running|succeeded|failed,baselineRevision,inputHash,engineVersion,calendarVersion,overrides,baseline:ScheduleResult|null,scenario:ScheduleResult|null,resultHash:string|null,errorCode:string|null,createdAt}.
- Proposal: {id,sourceType,sourceId:UUID|null,baselineRevision,actions:PlanAction[],payloadHash,state:pending|approved|rejected|expired|stale|executed,expiresAt,revision}.
- Approval: {id,proposalId,decision:approve|reject,approverMembershipId,payloadHash,reason:string|null,decidedAt}.
- AuditEvent: {id,actorType,actorId,projectId:UUID|null,action,targetType,targetId,outcome,redactedDelta,requestId,occurredAt}.
- Insight: {id,status,revision,asOf,facts:[{id,type,value,evidenceRefs:UUID[]}],riskScore:int|null,priorityRecommendations:[{taskId,reasonFactIds:string[]}],progress:{done:int,total:int},explanation:string|null,explanationStatus:available|unavailable|rejected}.
- JobRef: {id,status:queued,resourceId:UUID,pollUrl:string}. Poll URL must be same API origin, authorized on use.
- PlanAction discriminated union: task.create{clientRef,title,remainingEffortDays,resourceUnits,releaseOffset,assigneeMembershipId?,milestoneId?}; task.update{taskId,patch:{title?,remainingEffortDays?,resourceUnits?,releaseOffset?,assigneeMembershipId?:UUID|null,milestoneId?:UUID|null,priority?}}; task.archive{taskId}; dependency.add{predecessorTaskId,successorTaskId}; dependency.remove{dependencyId}; milestone.create{clientRef,name,targetDate?,critical}; milestone.update{milestoneId,patch:{name?,targetDate?:date|null,critical?}}; project.plan.update{patch:{startDate?,targetDate?:date|null,capacityUnits?}}. Batch ≤100 actions; clientRef references resolved only within same batch, cannot collide with UUIDs. No arbitrary patch paths.
- ScenarioOverrides: {tasks?:[{taskId,remainingEffortDays?:int,resourceUnits?:int}],addDependencies?:[{predecessorTaskId,successorTaskId}],removeDependencyIds?:UUID[],capacityUnits?:int,targetDate?:date|null,milestoneTargets?:[{milestoneId,targetDate:date|null}]}; max 500 task overrides, 2,000 total resulting edges; all IDs exist in captured project.

## Identity and organization endpoints
| Method and route | Purpose; permission; scope; effect | Request | Success | Additional checks/errors |
|---|---|---|---|---|
| GET /auth/login | Start OIDC; public; W auth attempt | query {returnPath?:string} | 302 provider redirect, short-lived state cookie | Allowlisted local return path; 400 invalid, 429, 503 provider failure |
| GET /auth/callback | Complete OIDC; public validated attempt; W | provider query {code,state} or {error,state} | 302 local return path + session cookie | One-use state, nonce, PKCE, issuer; 400 invalid/expired, 401 provider rejection |
| GET /me | Current context; session; global R | none | 200 UserContext | Suspension 403; no cached role authorization |
| GET /auth/csrf | Get session-bound CSRF token; session; global R | none | 200 {csrfToken:string} | No-store; no CORS exposure |
| POST /auth/logout | Revoke current session; global W | {} + CSRF | 204, clear cookie | Idempotent even already revoked; Origin checked |
| POST /tenants | Onboard organization; active user; global W | {name,slug,timezone} | 201 Tenant plus ownerMembershipId | Atomic first Owner; user creation quota; slug conflict 409 |
| GET /tenants/{tenantId} | Selected org metadata; org.read; T R | none | 200 Tenant | Membership and tenant status required |
| PATCH /tenants/{tenantId} | Settings; org.manage; T W | {name?,timezone?} + If-Match | 200 Tenant | No status/owner changes in this route |
| GET T/memberships | Team directory; org.read; T R | L | 200 Member[] | Member view omits privileged/email fields |
| PATCH T/memberships/{id} | Role/suspension; org.manage; T W | {orgRole?,status?} + If-Match | 200 Member | Admin can change ordinary Members only; Owner for Admin/Owner changes; last Owner 409 |
| POST T/owner-transfers | Transfer ownership; org.owner; T W | {targetMembershipId,expectedSecurityRevision:int,retainOwner:boolean} | 200 {tenantSecurityRevision,owners:UUID[]} | Recent reauth; target active; atomic no-owner prevention |
| POST T/invitations | Invite; org.manage; T W | {email,orgRole:Admin|Member} | 201 Invitation + acceptanceLink | Admin cannot grant Admin; normalized verified email; existing member/pending invite 409 |
| GET T/invitations | Pending/history; org.manage; T R | L | 200 Invitation[] | No token in lists |
| POST T/invitations/{id}/revoke | Revoke; org.manage; T W | {} | 200 Invitation | Terminal accepted invitation 409 |
| POST /invitations/accept | Redeem invitation; session bootstrap W | {token:string} | 200 {tenantId,membershipId} | Verified email equality, expiry, active tenant, one use; invalid token 404; consumed/expired 409; never elevate existing role silently |
| GET /platform/tenants | Operational metadata; platform.manage; global R | L | 200 [{id,name,status}] | No tenant project content; privileged read audited |
| PATCH /platform/tenants/{id} | Suspend/reactivate; platform.manage; global W | {status:active|suspended,reason:string} + If-Match | 200 {id,status,revision} | Required reason; sensitive change audit |
| PATCH /platform/users/{id} | Suspend/reactivate account; platform.manage; global W | {status:active|suspended,reason:string} + If-Match | 200 {id,status,revision} | No content access; revoke sessions; last platform admin self-lockout 409 |

## Projects and collaboration endpoints
| Method and route | Purpose; permission; scope; effect | Request | Success | Additional checks/errors |
|---|---|---|---|---|
| GET T/projects | Visible project list/dashboard basis; project.read; T R | L + {status?:active|archived} | 200 Project[] | Filter before pagination, never fetch-all then filter |
| POST T/projects | Create empty plan; project.create; T W | {name,description?,startDate,targetDate?:date,capacityUnits:int,managerMembershipIds:UUID[]} | 201 Project | Active same-tenant managers; no embedded tasks; creation audit |
| GET P | Project metadata; project.read; P R | none | 200 Project | Hidden project 404 |
| PATCH P | Name/description/archive; project.manage; P W | {name?,description?,status?:active|archived} + If-Match | 200 Project | Schedule fields only through proposals; archive invalidates execution |
| GET P/members | Project team; project.read; P R | L | 200 ProjectMember[] | Same-tenant directory subset |
| POST P/members | Grant project access; project.manage; P W | {membershipId,projectRole} | 201 ProjectMember | Active tenant member; duplicate 409 |
| PATCH P/members/{id} | Change role; project.manage; P W | {projectRole} + If-Match | 200 ProjectMember | Cannot alter organization role |
| DELETE P/members/{id} | Remove project grant; project.manage; P W | If-Match | 204 | Owner/Admin inherited access unaffected and disclosed |
| GET P/milestones | Milestones; project.read; P R | L | 200 Milestone[] | Computed forecast from insights/simulation, not targetDate |
| GET P/tasks | Tasks; project.read; P R | L + {status?,assigneeMembershipId?,milestoneId?} | 200 Task[] | Validate filter IDs in P |
| GET P/tasks/{id} | Task detail; project.read; P R | none | 200 Task | Bound to URL project |
| PATCH P/tasks/{id}/progress | Observed progress; task.contribute; P W | {status,progressPercent,remainingEffortDays,actualFinishOffset?:int} + If-Match | 200 Task + {planRevision:int} | Team Member must be assignee; done invariant; records facts, not hypothetical change; increments planRevision and emits event |
| GET P/dependencies | Dependency graph; project.read; P R | L | 200 Dependency[] | Paginate all edges before client graph analysis |
| GET P/tasks/{id}/comments | Discussion; project.read; P R | L | 200 Comment[] | Parent task authorized first |
| POST P/tasks/{id}/comments | Add comment; task.contribute; P W | {body:string} | 201 Comment | Team Member can comment on any accessible project task; no raw HTML |
| PATCH P/tasks/{id}/comments/{commentId} | Edit own comment; task.contribute; P W | {body} + If-Match | 200 Comment | Only original author; manager may delete, not impersonate edits |
| DELETE P/tasks/{id}/comments/{commentId} | Delete own/moderate; task.contribute or project.manage; P W | If-Match | 204 | Author or manager; preserve redacted moderation audit |
| GET T/notifications | Own inbox; notification.self; T R | L + {unread?:boolean} | 200 Notification[] | Recipient bound to session membership |
| PATCH T/notifications/{id} | Mark read; notification.self; T W | {read:boolean} + If-Match | 200 Notification | No recipient override |
Structural task/milestone/dependency creation and changes deliberately use the proposal endpoints below. This gives one enforcement path rather than exposing an approval-bypassing CRUD path. Observed progress is a factual update, audited and revisioned; it can invalidate pending proposals.

## Intelligence, policy and workflow endpoints
| Method and route | Purpose; permission; scope; effect | Request | Success | Additional checks/errors |
|---|---|---|---|---|
| POST P/insights | Calculate facts and optional AI summary; insight.read; P Q | {expectedPlanRevision:int,includeExplanation:boolean} | 202 JobRef | Budget check; provider failure yields facts with explanationStatus unavailable |
| GET P/insights/{id} | Report incl. risk, priority and progress; insight.read; P R | none | 200 Insight | Reauthorize report and evidence; stale revision label |
| GET P/policies | Policies; project.read; P R | L | 200 Policy[] | Viewers cannot edit |
| POST P/policies | Create policy container; policy.manage; P W | {name} | 201 Policy | Duplicate name 409 |
| POST P/policies/{id}/interpretations | AI candidate only; policy.manage; P Q | {text:string 1..8000} | 200 {candidate:PolicyDefinition|null,ambiguities:string[],validation:ValidationReport} | Does not publish; 503 AI unavailable; no candidate on unsafe/ambiguous input |
| POST P/policies/{id}/versions | Store immutable proposed definition; policy.manage; P W | {inputText?:string,definition:PolicyDefinition} | 201 PolicyVersion | Schema-invalid rejected 422; semantic-invalid version retained with report, cannot publish |
| GET P/policies/{id}/versions | Version history; project.read; P R | L | 200 PolicyVersion[] | Same policy/project binding |
| POST P/policies/{id}/versions/{versionId}/validate | Revalidate exact version; policy.manage; P W | {} | 200 ValidationReport | Recompute against active policies; stored report bound to hash |
| POST P/policies/{id}/versions/{versionId}/publish | Publish active version; policy.manage; P W | {definitionHash,expectedPolicyRevision:int} | 200 Policy | Fresh semantic/conflict validation; 409 concurrent active change; 422 conflicts |
| PATCH P/policies/{id} | Rename/disable; policy.manage; P W | {name?,status?:disabled} + If-Match | 200 Policy | Activation only via publish; disable stops new evaluation and blocks pending execution |
| POST P/policies/{id}/evaluations | Evaluate persisted authorized event; policy.manage; P Q | {eventId:UUID} | 202 JobRef | Event type/scope/revision verified; no client fact overrides; duplicate deduplicated |
| GET P/events | Select business events for evaluation/history; project.read; P R | L + {type?:string} | 200 [{id,type,planRevision,occurredAt}] | Redacted metadata only |
| GET P/workflow-executions | Execution history; project.read; P R | L + {policyId?:UUID,state?:string} | 200 WorkflowExecution[] | Validate enum and policy filter |
| GET P/workflow-executions/{id} | Trace details; project.read; P R | none | 200 WorkflowExecution | No raw secret prompts |

## Simulations, proposals, audit and health
| Method and route | Purpose; permission; scope; effect | Request | Success | Additional checks/errors |
|---|---|---|---|---|
| POST P/simulations | Snapshot and queue deterministic run; simulation.run; P Q | {expectedPlanRevision:int,overrides:ScenarioOverrides} | 202 JobRef | Consistent snapshot; graph/resource validation; 422 cycle/invalid input, 409 stale |
| GET P/simulations | Scenario history; project.read; P R | L | 200 Simulation[] (omit task result arrays in list DTO) | Tenant/project filter |
| GET P/simulations/{id} | Run status/full results; project.read; P R | none | 200 Simulation | Reauthorization even if creator removed |
| GET P/simulations/{id}/comparison | Baseline-vs-scenario; project.read; P R | none | 200 {simulationId,baselineRevision,stale:boolean,completionDeltaDays:int,milestoneDeltas:[],changedTaskIds:UUID[],explanations:string[]} | 409 RESULT_NOT_READY; typed milestone deltas {id,baselineOffset,scenarioOffset,deltaDays,latenessDeltaDays}, nullable when unknown |
| POST P/proposals | Manual or simulation plan change; proposal.create; P W | {sourceType:manual|simulation,simulationId?:UUID,expectedPlanRevision:int,actions?:PlanAction[]} | 201 Proposal | For simulation server derives actions from stored overrides; actions forbidden; manual requires actions; canonical hash; cycle/impact validation |
| GET T/proposals | Approval inbox; proposal.approve or proposal.create; T R | L + {state?,projectId?} | 200 Proposal[] | Managers see own accessible projects; approvers see eligible tenant proposals |
| GET P/proposals/{id} | Review exact delta/impact; project.read; P R | none | 200 Proposal + {impact:ScheduleResult} | Same immutable payload shown to approver |
| POST P/proposals/{id}/decisions | Approve/reject; proposal.approve; P W | {decision:approve|reject,payloadHash,reason?:string ≤2000} | 201 Approval + {proposalState} | Distinct from proposer; lock proposal; stale/expired/terminal 409 |
| POST P/proposals/{id}/execute | Apply once; proposal.execute; P W | {payloadHash} | 200 {proposalId,state:executed,planRevision,auditEventId} | Recheck actor/proposer/approver, current policy conditions, hash/expiry/revision; unapproved 403; stale 409; replay same actor reauthorized returns original result |
| GET T/audit-logs | Tenant audit; audit.read; T R | L + {projectId?:UUID,action?:string,from?:timestamp,to?:timestamp} | 200 AuditEvent[] | PM must supply accessible projectId, receives business events only; range ≤90 days; no global logs |
| GET /health | Liveness; public R | none | 200 {status:"ok"} | No dependency details; 500 if process unhealthy |
| GET /ready | Readiness; public R | none | 200 {status:"ready"} or 503 {status:"not_ready"} | Checks DB with strict timeout; AI outage does not make core API unready; no credentials/version dump |

No generic job-detail endpoint: JobRef pollUrl targets the relevant simulation, insight or workflow execution resource. Manual policy evaluation allocates WorkflowExecution before returning JobRef. Automatic notifications use internal actions, never unrestricted public send endpoints. No exports/file APIs in initial scope. Reporting is project/dashboard aggregation plus Insight and workflow/simulation history; download formats are deferred.
