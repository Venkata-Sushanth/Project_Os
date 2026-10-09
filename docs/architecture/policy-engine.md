# ProjectOS — AI policy and workflow engine
Proposed design. AI interpretation is probabilistic; validation, evaluation, approval and execution are deterministic.

## Representation and lifecycle
Initial scope: project-scoped policies only, immutable versions and fixed enums. PolicyDefinition is a JSON object with schemaVersion:"1", event, when, actions and cooldownMinutes (integer 0..1440).
Events: task.progress.updated, project.plan.changed, project.risk.calculated, proposal.created.
when is {all:Predicate[]} or {any:Predicate[]}, at most 20 predicates, no recursive nesting. Predicate = {fact,op,value}; op in eq,gt,gte,lt,lte; value type must match fact.
Allowlisted facts:
- task.overdueDays: integer ≥0 from explicit asOf working date and planned task finish.
- task.blocksCriticalMilestone: boolean from validated dependency reachability and critical milestone association.
- project.riskScore: integer 0..100 or unknown.
- proposal.completionDelayDays: signed integer from deterministic comparison.
- proposal.newDeadlineMiss: boolean from baseline/scenario target comparison.
- task.priority: low|normal|high|critical.
Unknown required facts yield indeterminate, never match. Evaluation records this reason.
Actions: notifyProjectManager{template:overdueBlocker|highRisk|approvalNeeded}; proposeTaskPriority{priority:high|critical}; requireApproval{reasonCode:materialDelay|deadlineMiss}. No emails, URLs, SQL, scripts, dynamic recipient queries or arbitrary templates. Task action targets the event's validated task; recipients resolve current project managers. Max 5 actions.
All consequential plan/priority changes require approval irrespective of policy content. requireApproval documents a business gate and reason; absence of this action cannot remove the platform gate. Notification actions are low-impact and may run automatically under a narrow service principal.

Lifecycle:
1. Authorized PM supplies text; backend builds minimal project-specific prompt without secrets.
2. Adapter returns candidate plus ambiguities, never executable instructions.
3. Strict schema validation rejects extra keys, bad types, unsupported facts/actions and size violations.
4. Semantic validation checks event/fact compatibility, same-project references, thresholds, target types and actor permissions.
5. Conflict validation checks active versions: reject opposing priority targets on potentially overlapping predicates unless disjointness is proven in the bounded language. Deduplicate identical notifications. Approval restrictions compose using the strictest gate.
6. Store immutable PolicyVersion and hash; invalid semantic drafts may be reviewed but cannot publish. A correction is a new version.
7. Publish only after fresh validation against currently active policies, transactionally switch active pointer, audit.
8. Evaluate a persisted project event and versioned evidence snapshot. Unique event+version deduplicates retries; predicates return matched/notMatched/indeterminate.
9. Notification-only execution rechecks active tenant, policy and publisher's present policy.manage authority. Consequential actions produce immutable ActionProposal owned by the publishing member.
10. Independent Owner/Admin approves exact payload hash. Executor and all relevant authority are rechecked before applying.
11. Persist WorkflowExecution, decision facts, proposal/approval linkage, outcomes and audit/outbox atomically where relevant.

Policy publishing grants no general service authority. Disabled policy, revoked publisher or stale event blocks execution. At execution, reevaluate conditions against current facts using an explicit new asOf value; if no longer true, mark skipped/stale and require a new proposal if desired. This is distinct from reproducibly replaying the original evaluation evidence.

## Three example policies
| Natural language | Deterministic condition | Action and guard |
|---|---|---|
| Escalate an overdue task blocking a critical milestone | task.overdueDays > 0 AND task.blocksCriticalMilestone = true on task.progress.updated | Propose critical priority and notify PM; priority waits for independent approval |
| Require approval when a plan materially delays delivery | proposal.completionDelayDays ≥2 OR proposal.newDeadlineMiss = true on proposal.created | requireApproval with evidence; platform already requires approval for every plan mutation in initial release |
| Notify the PM when project risk reaches 70 | project.riskScore ≥70 on project.risk.calculated | Deduplicated in-app highRisk notification; no plan mutation; 1,440-minute cooldown |

Risk score v1 is a reviewable heuristic: min(100, 20 × count of overdue tasks that block a critical milestone + 30 × count of missed milestone targets). Overdue and missed counts derive from versioned schedule/asOf facts. Missing necessary schedule data yields unknown, not zero. This score is a triage indicator, not a statistical probability. Bottleneck facts list zero precedence-slack tasks and resource-induced delays; task recommendation order uses blocked critical milestone first, overdueDays descending, precedenceSlack ascending, then task ID. Progress summary reports done/total and observed progress without converting percentage to remaining effort. AI may explain these facts with references; unsupported claims are rejected.

## Complete worked policy trace
Policy input: “If an overdue task blocks a critical milestone, mark it critical and alert the project manager.”
Candidate:
```json
{
  "schemaVersion": "1",
  "event": "task.progress.updated",
  "when": {"all": [
    {"fact": "task.overdueDays", "op": "gt", "value": 0},
    {"fact": "task.blocksCriticalMilestone", "op": "eq", "value": true}
  ]},
  "actions": [
    {"type": "proposeTaskPriority", "priority": "critical"},
    {"type": "notifyProjectManager", "template": "overdueBlocker"}
  ],
  "cooldownMinutes": 1440
}
```
Hypothetical tenant A, project P, PM Maya and Owner Owen. Task T is normal priority, three working days overdue and an ancestor of a task in critical milestone M. Project revision is 12. All names and IDs are illustrative.
1. Validator accepts supported facts/actions, correct types and same-project context; no conflicting active priority policy. Maya publishes version 1 with definition hash H1.
2. Authorized progress event E12 includes asOf and evidence T/M/revision 12. Evaluator records true/true, matched, H1 and evidence hash.
3. It emits a deduplicated PM notification and proposal Q with task.update priority=critical, baselineRevision=12, proposer=Maya, payloadHash=HQ, expiresAt seven days later. Execution history is awaitingApproval.
4. Owen reviews exact action and evidence; different user, active Owner, project access and matching HQ. Approval stores HQ; Q becomes approved. Approval does not change T.
5. Maya executes Q. Transaction locks Q/project/authority records; checks current permissions for Maya/Owen, active policy, HQ, expiry and revision 12; reevaluates overdue/blocking condition with explicit execution asOf.
6. On success T becomes critical, planRevision becomes 13, Q executed, execution result recorded, audit event links E12/H1/Q/Owen/Maya and redacted old/new priority; outbox stores project event. On changed revision or condition, no task mutation occurs.
7. Retry of Q returns original authorized result; no duplicate priority change or notification. Downstream events do not recursively evaluate without chain depth/budget checks.

## Approval state machine and safety
pending → approved OR rejected; pending/approved → expired OR stale; approved → executed. No transition out of executed/rejected/expired/stale. New payload requires new proposal and approval. One independent approval suffices initially; rejection terminates. Approval expires with proposal. Approver eligibility must still hold at execution. Sole-owner tenants need a second authorized person to demonstrate changes; no bypass.
Each execution is limited to allowlisted backend command handlers, with the same permission/transaction checks as manual requests. Transactional idempotency and unique event/version keys protect against duplicate processing. Cascade depth capped at 3, with per-project action budgets and cooldowns; loops end with audited skipped outcome.
Ambiguous language returns questions in the product, not an activated policy. Unsupported actions are rejected with alternatives from the allowlist. Conflicts block publication rather than silently choosing one. Provider timeout returns an editable manual structured draft option; malformed output never reaches executor.
