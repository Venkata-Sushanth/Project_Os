# ProjectOS — Future testing strategy
This is a plan, not an executed application test suite. Phase 0 checks documentation only.

## Layers and ownership
| Layer | Scope | Future tooling direction | Pass evidence |
|---|---|---|---|
| Unit | Pure policy schema/semantic rules, authorization matrix, state transitions, graph and scheduling math | TypeScript test runner selected at implementation | Fixed fixtures and property-style cases with exact expected outputs |
| Integration | PostgreSQL constraints/RLS/pooling, Prisma transactions, idempotency, outbox/jobs | Disposable isolated PostgreSQL with runtime and migration roles separated | Actual DB enforcement under concurrency and pooled reuse |
| API/contract | Strict input/output DTO, statuses, CSRF, tenant scope, cursors | HTTP tests against service; adapter contract tests | Mock and HTTP adapters satisfy same contract |
| Security | Two-tenant matrix, injection, role drift, replay, secrets/log checks | Automated negative tests plus manual abuse review | No known unauthorized read/write or sensitive logging |
| End-to-end | Mock UI first, then actual authenticated policy/simulation path | Browser automation chosen in future phase | Evidence of full user journey incl. denial and stale states |
| Operational | Deployment probes, restart/retry, limits, restore | Staging only after resource approval | Recovery procedure and bounded failure behavior |

## Required scenarios
| ID | Setup/action | Expected assertion |
|---|---|---|
| ISO-01 | User A requests B project/task/simulation/policy/proposal/audit by ID | 404; no content/count/timing-sensitive detail in body; no mutation |
| ISO-02 | A body references B assignee, milestone or dependency | Validation/hidden-resource failure; composite constraint prevents bypass |
| ISO-03 | User is Owner in A and Viewer in B; alternate concurrent tabs | Writes in B denied; caches, jobs and DB connection contexts do not inherit A |
| ISO-04 | Active tenant Member without ProjectMember requests project | Denied despite valid membership; lists filter before pagination |
| ISO-05 | Tenant A then B then no-context on same pooled connection | Only authorized rows; no-context fails closed under planned RLS |
| ISO-06 | Ordinary runtime DB role executes direct unscoped tenant query | RLS constrains it; migration owner not used by application |
| AUTH-01 | Expired/replayed OIDC state or wrong nonce/issuer/audience | No session; safe failure |
| AUTH-02 | Missing CSRF, forged Origin or identity header | Mutation denied; backend authenticates session independently |
| AUTH-03 | Invite wrong email/expired/reused; last Owner removal | Rejected atomically; no unauthorized membership/elevation |
| AUTH-04 | Suspend account/tenant or revoke membership after queueing | Subsequent access/job execution denied |
| POL-01 | Viewer calls interpretation/publish/evaluate/execute | 403 or hidden 404; no execution created |
| POL-02 | AI returns SQL, scripts, foreign IDs, unknown actions or extra keys | Strict rejection, no executor call |
| POL-03 | Overlapping policies propose conflicting priorities | Publication blocked with deterministic conflict report |
| POL-04 | Repeated same event and retry after worker crash | One logical execution and deduplicated notification |
| APR-01 | Self-approval, changed hash or no approval | Denied; proposal cannot execute |
| APR-02 | Approve then downgrade approver/proposer/executor | Execution rechecks all and fails closed |
| APR-03 | Approve then progress update changes planRevision | 409 stale; no partial plan change |
| APR-04 | Two concurrent execute requests | One commit; second returns prior result after authorization; one audit business change |
| APR-05 | Expired proposal or policy condition no longer true | No execution; terminal expired/stale or recorded skipped result |
| SIM-01 | Worked example from simulation-engine.md | Baseline finish 7; effort scenario 9; lateness 0→1; staffing scenario 9 |
| SIM-02 | Same input with shuffled array/key order and different wall clock | Identical canonical input/result hashes |
| SIM-03 | Self-edge, cycle, cross-project edge, invalid effort/capacity/horizon | 422; no successful result or live plan change |
| SIM-04 | Run valid simulation, compare all live plan rows/revision before/after | Unchanged; only Simulation/Job/Audit records added |
| SIM-05 | Capacity 1 vs 2, zero effort, disconnected graph, completed predecessors | Feasible deterministic schedule; explicit unknown empty milestone |
| SIM-06 | Concurrent opposite dependency edges via proposals | At most one compatible revision commits; resulting graph remains acyclic |
| AI-01 | Foreign-tenant canary in unrelated fixture | Absent from outgoing AI context, cache and explanation |
| AI-02 | Provider timeout or invented evidence/number | Deterministic facts remain; explanation unavailable/rejected |
| AUD-01 | Critical mutation audit write fails | Whole mutation rolls back |
| AUD-02 | Attempt update/delete audit using runtime role | Denied; maintenance operation separately audited |
| API-01 | Unknown fields, malformed cursor, wrong filter scope, bad enums | Defined 400/422/404; no silent acceptance |
| API-02 | Pagination with equal timestamps and changed permissions | Stable tie-break; no cross-scope cursor reuse or stale-access leak |
| API-03 | Idempotency same key/different payload, stale If-Match, missing If-Match | 409/409/428 respectively; no duplicate mutation |
| OPS-01 | Process restart mid-job and outbox delivery retry | Lease recovery, bounded retry and deduplication |
| UX-01 | Keyboard-only policy→proposal→approval→execution path | Focus, labels, errors and evidence accessible; permissions visibly clear |

## Quality gates by phase
G0 documentation: 11 required documents, baseline traceability, valid diagram structure, resolved internal naming/contracts, no implementation files. User review can approve defaults later; unanswered product choices are recorded.
G1 frontend prototype: explicit Phase 1 authorization; contract-shaped fixtures, all key empty/error/denied/stale states, two-tenant mock scenarios and keyboard review. Must not claim backend security.
G2 backend foundation: session and tenant negative tests, composite FK and RLS integration proof, migration review/rollback plan, no secrets in artifacts. No real data before isolation tests pass.
G3 differentiator slice: all POL/APR/SIM/AI critical tests pass; reproducible worked example; successful and denied end-to-end path.
G4 integration/release: contract and end-to-end suites green, no unresolved critical/high authorization defects, warm performance targets measured, staging restart/recovery checks, provider/budget/retention decisions reviewed. Production additionally requires backup restoration and approved hosting reliability.

## CI plan
Future GitHub Actions: dependency lockfile install only in authorized implementation phase, typecheck, lint, unit/contract tests, isolated DB tests, frontend build, security scans and E2E for protected main. Least-privilege token; untrusted PRs receive no deployment/AI credentials. Provider responses mocked in ordinary CI; optional explicitly budgeted sandbox integration tests use synthetic data. Branch protection requires checks and review once configured.
Do not use a coverage percentage as a substitute for critical-path evidence. Every authorization branch and proposal terminal state needs explicit tests. Snapshot-only assertions are insufficient for security or scheduling correctness.
