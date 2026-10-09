# ProjectOS — Ordered implementation roadmap
Phase 0 ends with these documents. Every future batch below is a plan. Do not start Phase 1 until the user explicitly authorizes the frontend prototype.

| Batch | Objective / prerequisites | Deliverables and likely files/modules | Verification / exit criteria | Risks/dependencies |
|---|---|---|---|---|
| 0 Architecture checkpoint | Inspect repository, reconcile supplied baseline | docs/architecture/*.md only | G0: all 11 documents consistent, assumptions listed, planning-only diff | Review role/approval/calendar/auth choices |
| 1 Contract-first mock foundation | Explicit Phase 1 authorization; agreed DTO names and roles | Future apps/web shell, packages/contracts, frontend client interface, mock adapter, synthetic fixtures | Typecheck/contract-shape checks; A Owner/B Viewer selection; no real auth/AI/database | Avoid embedding mock data inside components |
| 2 Differentiator prototype | Batch 1 | Policy editor→validation→execution history; simulation builder→comparison; proposal inbox; task plan context | Demonstrate three policy fixtures, worked simulation, stale/denied/error states; keyboard review | Clearly label mock outcomes; no backend claims |
| 3 Minimal project UI completion | Batch 2 | Project/task/milestone/dependency views, membership/settings, insights/reporting/audit/notifications | All frontend inventory paths navigable; responsive review; mock adapter remains replaceable | Resist unrelated CRUD expansion |
| 4 Backend security and persistence foundation | Separate authorization for backend work; stabilize domain/API; choose OIDC and hosting budget | Future apps/api modules identity/tenancy/authorization; packages/contracts; Prisma models and reviewed migrations only now; RLS integration proof | G2 session, multi-org, FK, RLS/pooling, CSRF and suspension tests pass | Provider SDK versions, migration-vs-runtime credentials and pool behavior |
| 5 Deterministic vertical slice | Batch 4 | Domain schedule/policy validators, plan snapshots, proposal/approval/execution transaction, audit/outbox; minimal task progress | SIM/APR core tests and one complete backend scenario→approval→apply path pass | Lock order, stale revisions, independent approver |
| 6 AI-assisted policy and intelligence | Batch 5; provider data/budget terms chosen | AI adapter, structured interpretation, evidence-backed insights, policy version publication/evaluation, notification workflow | POL/AI tests; provider outage fallback; three real deterministic policy examples | Prompt injection, cost ceilings, invalid outputs |
| 7 Frontend/API integration | Batches 3–6; contract compatibility | HttpProjectOSClient replaces mock adapter through configuration; auth/organization shell wiring | Same UX against backend; full two-tenant E2E path, no fixture fallback in production build | Cookie gateway deployment and CSRF forwarding |
| 8 Collaboration and durable jobs | Core differentiators already integrated | Remaining invitation/team/comments/audit filters, outbox leases, worker recovery and operational metrics | Full API matrix, retries/revocation, notification deduplication; G3 green | Always-on worker requires budget; free API sleep |
| 9 Staging demonstration | Explicit provisioning authorization, cloud decisions and quotas rechecked | Future GitHub Actions, staging Vercel/Render/Neon configuration, runbook and synthetic seed process | G4 staging: warm performance, restart, probes, full demonstration, secret scans | No free-tier SLA; cold starts; production data forbidden until gates |
| 10 Production readiness decision | User explicitly chooses production deployment/budget | Backups, tested restore, retention jobs, alert destinations, commercial plans, rollout/rollback runbook | Signed release checklist; RPO/RTO measured, isolation green, provider terms reviewed | This is not an automatic continuation of Phase 0 |

## Demonstration story and gates
Use two tenant organizations and a multi-membership user, plus separate PM and Owner actors. Create a project plan through approved actions; record progress showing an overdue blocker; publish a validated policy; evaluate event; inspect proposed critical-priority change; independently approve; execute once and inspect audit.
Then capture baseline, increase a task duration, compare milestone delay, create a proposal, approve and apply. Repeat with stale revision and unauthorized cross-tenant ID to show safe rejection. Finally display deterministic risk facts and optional evidence-backed AI explanation. This path takes priority over elaborate dashboards.

## Future deployment sequence
After authorization only: select budget/provider/region → provision isolated development/staging DB and OIDC client → create least-privilege runtime and migration identities → review/apply migrations → deploy backend/worker with secrets and probes → deploy frontend gateway with environment-specific callback → configure OIDC exact redirect → run synthetic isolation/E2E tests → review production readiness → provision separate production resources and perform controlled release.
Never point preview at production data. Forward-only schema rollout must preserve compatibility with prior application version until cutover. Rollback application artifact first when safe; database recovery requires tested migration/restore procedure, not assumed down migrations. Production resource creation is outside Phase 0.

## Phase 0 acceptance and baseline traceability
| Supplied baseline area | Evidence |
|---|---|
| §1 product and eight core capabilities | requirements FR-01–FR-11; reporting via frontend and Insight contracts |
| §2 technology | system-architecture and AD-01/02/03/07/13 |
| §3 multi-tenancy and roles | requirements role matrix; security invariants; domain composite keys/RLS |
| §4 entities | domain-model catalogue and ER diagram |
| §5 policy/simulation/intelligence | policy-engine examples and lifecycle; simulation algorithm/worked example; API Insight schema |
| §6 frontend/mock prototype | frontend-plan page inventory, typed replaceable adapters |
| §7 cloud | system architecture environments/CORS/pooling; decisions AD-13; deployment sequence above |
| §8 security | security-design threat matrix; testing-strategy negative scenarios |
| §9 artifacts | Eleven named documents in this directory |
| §10 restrictions | Only Markdown planning files created; no application setup or resource provisioning |
| §11 acceptance | G0 documentation checks; future behavior intentionally not tested/claimed |
| §12 stopping boundary | Stop after Phase 0; explicit Phase 1 authorization required |

## Review items carried forward
Confirm Owner/Admin project visibility, normalized role mapping, independent approval and seven-day expiry, initial all-plan-change approval gate, materiality threshold, generic capacity/calendar assumptions, retention periods, OIDC and AI providers, region/budget, and always-on job needs. These do not require another approval to finish Phase 0; they are decisions for architecture review before dependent implementation.
