# ProjectOS — Security and multi-tenant threat model
Proposed controls, not implemented security guarantees. Role definitions: [requirements](requirements.md). Session protocol: [architecture](system-architecture.md). Contracts: [API](api-contracts.md).

## Assets, adversaries and boundaries
Assets: tenant plans, identities, invitations, policy definitions, scenario snapshots, approvals, audit evidence, credentials and provider budgets. Adversaries include unauthenticated callers, malicious legitimate members, users with different roles in different tenants, compromised AI content/providers and compromised operator credentials.
Trust boundaries: browser→gateway→backend; backend→database; backend→OIDC/AI; API→worker; tenant→tenant; platform operations→tenant content. Treat every boundary crossing as untrusted input. RLS helps contain query mistakes, but cannot contain a fully compromised privileged database operator.

## Mandatory invariants
1. A client tenant ID selects a context; it never proves authority.
2. Resolve active session, user, tenant and Membership server-side on each tenant operation.
3. Every repository query, join, count, mutation and uniqueness check uses verified tenant scope.
4. Membership is insufficient: check relevant project/resource permission, including list filtering.
5. AI output cannot create permission, bypass validation or authorize a write.
6. Never execute model-generated SQL, code, shell commands or arbitrary expression strings.
7. Approved proposals are reauthorized at execution: executor, proposer, approver eligibility, tenant, payload, revision, expiry and policy gates.
8. Simulation computation only reads captured inputs and writes simulation records; applying results requires a separate proposal.
9. Significant security and business changes have durable actor/tenant/request context and redacted audit evidence.
10. Jobs use the same tenant and authorization rules, rechecked after queue delay; a serialized actor ID is not authorization.
11. Composite keys prohibit cross-tenant and cross-project relationships independently of route validation.
12. Platform Super Admin cannot read or change tenant project content through platform authority alone.
13. Critical changes, audit events and outbox events commit together or roll back together.

## Threats and required controls
| Threat / abuse case | Prevention and detection | Residual risk / test |
|---|---|---|
| IDOR: swap A project/task/approval ID for B | Query by tenant+project+id; nested parent binding; hide unauthorized existence as 404 | Test reads, writes, lists, counts and foreign IDs in bodies |
| Multi-org privilege bleed | Context immutable per request; caches keyed user+tenant+project; no global “isAdmin” | Concurrent browser tabs A Owner/B Viewer; reused DB connection tests |
| Cross-tenant FK or graph edge | Composite FKs, same-project graph validation, transactional project lock | Concurrent edge insertion test must not create cycle |
| Session theft/fixation/CSRF | OIDC code+PKCE/state/nonce, secure HttpOnly host-only cookie, rotation, expiry, logout revocation; session-bound CSRF and Origin checks | XSS still threatens actions; escaped rendering, CSP and dependency review |
| Forged identity proxy headers | Strip incoming identity headers; backend independently authenticates opaque session | Direct backend call with spoofed header denied |
| Invitation theft/replay | Hash tokens at rest, 7-day expiry, verified email equality, one-use atomic redemption | No token in URL logs; redacted invalid-token responses |
| Account/tenant suspension race | Next-request validation; lock/revalidate authority during execution; revoke sessions | Define transaction ordering; execution committed before suspension is historical, not retroactively undone |
| Privilege escalation | Allowlisted role grants; Admin cannot grant Admin/Owner; last-owner protection; reauth owner transfer | Test self-edit and mass assignment |
| Unauthorized exports/files | Not in initial scope; future exports reauthorize creation/download, tenant storage prefixes, short-lived signed URLs | Never serve permanent public object links; delayed job revocation test |
| SQL injection | Prisma parameter binding, strict schemas; reviewed fixed SQL only for infrastructure constraints | No concatenated raw queries; RLS bypass roles prohibited for runtime |
| Prompt injection | Task/comment/policy text treated as data; bounded context, no tools, allowlisted schema | Red-team “ignore rules/send secrets/run SQL”; reject unsafe output |
| AI tenant leakage | Assemble authorized project evidence only; tenant-scoped caches; no shared conversation memory or vector index | Fixture scans outgoing payload for foreign canary strings; provider retention contract unresolved |
| Approval bypass/replay | Immutable hash/revision binding, independent approver, expiry, lock + state machine, idempotency | Test altered payload, double execute, same-user approval and expired/downgraded approver |
| Policy recursion/action storms | Event dedupe, max chain depth 3, action budget, cooldown, no arbitrary actions | Bounded notification count across retries and cascades |
| Audit tampering/leakage | Append-only runtime role; separate maintenance role; audit critical writes atomically; redact bodies/secrets | DB admin can still alter data; future external immutable archive needed for stronger assurance |
| API abuse/cost exhaustion | Per-IP/user/tenant quotas, request size caps, schedule bounds, AI token budget and circuit breaker | Shared quota store needed for multiple API replicas |
| Job privilege drift | Store references, reauthorize on run, lease and retry limits; no stale role snapshots | Remove membership after enqueue; job must fail closed |
| Unsafe errors/observability | Safe codes/request IDs, no SQL/prompt/cookie data; sanitize constraint errors | Automated log secret scans and unauthorized existence tests |

## Rate and resource budgets (initial proposed defaults)
Login 10 attempts/IP/10 min; ordinary API 120 requests/user/min and 1,000/tenant/min; AI interpretations 10/user/hour and 100/tenant/day; simulations 30/user/hour with 2 concurrent/tenant; proposal execution 20/user/min. Return 429 and Retry-After. Tenant AI spend ceiling configurable and enforced before provider requests; numerical currency budget awaits owner choice. Use persisted/shared counters or a provider facility before horizontal scaling. Do not pretend per-process counters enforce a global quota.

## Secrets, privacy and operations
Backend env/secret manager only: OIDC client secret, session signing/encryption keys as needed, DB credentials and AI keys. No NEXT_PUBLIC secrets, GitHub commits, example live keys, logs or frontend bundles. Least-privilege GitHub Actions tokens, environment approvals for future production and secret rotation procedures required. Preview uses separate identities/data.
AI receives minimal fact IDs and authorized text; credentials and raw membership lists excluded. No training/retention promises until provider terms are reviewed. Default no raw prompt retention; record model/adapter version and input/output hashes plus validated result. Support user-visible provider failure without losing core functionality.
Proposed retention is in [domain model](domain-model.md). Audit retention and deletion duties require product/legal review before real data. Backups are access-controlled; restoration tests must verify tenancy and avoid restoring revoked sessions. Incident workflow: suspend affected identity/tenant if warranted, revoke credentials, preserve restricted evidence, investigate scope, communicate through an approved process, then verify recovery. No incident channel is configured in Phase 0.

## RLS decision and release evidence
Shared schema with verified context and composite constraints is selected. Add RLS before real tenant data release only after proving non-owner roles, fail-closed context, transaction-local settings, pooling isolation and worker coverage. RLS is not enabled now. See [domain model](domain-model.md).
Release evidence must include two-tenant endpoint matrix, multi-role tests, connection reuse tests, approval race/replay tests, AI context canaries and a review of privileged maintenance paths. Failed isolation is a release blocker, never a warning.
