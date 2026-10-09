# ProjectOS — Architecture decision record
Status: selected planning defaults, pending architecture review; no implementation or provisioning. Baseline stack is preserved. Date checked: 2026-10-10.

## AD-01 Backend decomposition
Selected: separate TypeScript modular monolith, proposed Fastify adapter; domain modules for identity, tenancy, projects, policies, simulations, approvals and audit. Alternatives: microservices, Next.js-only backend. Rationale: single transaction boundary and low operational cost while honoring separate backend. Trade-off: shared deployment; revisit when independent scaling/team ownership is measured, not anticipated.

## AD-02 API style
Selected: versioned REST with explicit action resources and shared typed DTOs. Alternatives: GraphQL, RPC. Rationale: reviewable tenant routes, simple clients, clear approval side effects. Trade-off: some aggregation endpoints/results required; revisit GraphQL only for demonstrated client query complexity. No implementation framework dependency installed.

## AD-03 Authentication
Selected approach: managed standards-compliant OIDC identity provider, authorization-code + PKCE, backend-owned opaque server session, frontend same-origin gateway. Alternatives: self-managed passwords, browser bearer tokens, framework-coupled sessions. Rationale: delegate credential recovery/MFA while centralizing revocation and tenancy checks. Trade-off: gateway hop and session persistence; select provider before implementation based on development quotas, MFA/recovery, region and cost. No provider account configured. Exact SDK/security settings must be verified at implementation.

## AD-04 Tenant resolution
Selected: tenant ID in route + server-resolved active membership on every request; immutable TenantContext. Alternatives: subdomain-only resolution, trusted token tenant claims. Rationale: explicit multi-org navigation without stale authorization. Trade-off: membership lookup cost; revisit bounded caching only with reliable invalidation and revocation semantics.

## AD-05 Permission model
Selected: global Platform Super Admin; Owner/Admin/Member organization role; ProjectManager/TeamMember/Viewer project role. Owner/Admin inherit tenant project access, ordinary Member needs project grant. Fixed permissions and independent approval. Alternatives: custom roles/ABAC engine. Trade-off: less customization, smaller auditable surface; revisit when concrete customer roles demand it. Platform admin has no tenant content bypass.

## AD-06 Isolation and RLS
Selected: shared-schema tenant-owned records, scoped repositories, composite keys/FKs and project authorization. RLS planned as added real-data release safeguard after proof under runtime roles and pooling; not enabled now. Alternatives: schema/database per tenant, application-only forever. Trade-off: cheaper operations but higher shared-database blast radius; revisit dedicated databases for regulated isolation or large noisy tenants. RLS integration requirements are in domain-model.md.

## AD-07 PostgreSQL and Prisma
Selected: managed PostgreSQL, Prisma repository layer, explicit transactions and reviewed supplementary SQL constraints in future migrations. Alternatives: SQL-only query layer, another ORM. Trade-off: ORM productivity but graph integrity/RLS/partial uniqueness are not assumed automatic. Revisit if ORM transaction/pooling limitations obstruct correct tenancy. Pool size must be bounded per API/worker replica, with aggregate below provider connection budget; no long AI calls inside transactions. Migration connection mode is verified against selected versions before use.

## AD-08 AI adapter and intelligence
Selected: backend-only provider-neutral methods interpretPolicy and explainFacts with strict schema, timeout, budget and evidence validation. Alternatives: direct frontend integration, provider agents with database tools. Trade-off: constrained flexibility in exchange for authority separation. Deterministic facts remain usable without AI. Revisit multi-provider routing only for measured reliability/cost; no vector database required.

## AD-09 Policy representation
Selected: versioned bounded JSON predicates over enumerated facts and allowlisted actions. Alternatives: arbitrary scripts, general-purpose rules language, AI-only execution. Trade-off: narrower initial expression power, predictable validation and conflict analysis. Revisit additional expression forms through schema versions and test cases. Fixed approval controls cannot be weakened by authored policies.

## AD-10 Simulation algorithm
Selected: DAG precedence analysis plus deterministic bounded serial resource scheduling, integer working days, generic capacity units, immutable snapshots. Alternatives: CPM alone (cannot model staffing contention), optimization solver, stochastic simulation. Trade-off: feasible reproducibility without optimality or predictive confidence claims. Revisit calendars, individual skills or optimization when requirements/data justify complexity.

## AD-11 Background work
Selected: database-backed jobs/outbox and same-code worker, at-least-once delivery plus idempotency. Development can drain while API awake; reliable unattended work requires funded always-on runtime. Alternatives: immediate-only requests, external broker. Trade-off: simple infrastructure but database polling/load; revisit broker for demonstrated throughput or fan-out. No misleading promise of scheduled execution on sleeping free services.

## AD-12 Audit and retention
Selected: application append-only audit, transactional critical-change logging, minimal redacted payload, scoped readers and restricted maintenance. Alternatives: ordinary app logs, external event-sourcing system. Trade-off: database administrator remains trusted; revisit immutable external archive for stronger tamper-evidence/compliance. Retention defaults require review; no legal compliance claim.

## AD-13 Cloud hosting
Selected development direction: Vercel frontend, Render API, Neon PostgreSQL; no paid commitment. Isolated environments and PostgreSQL/provider adapters support migration. Exact entitlements must be rechecked before deployment.

| Service | Verified development limitation / quota | Implication and migration trigger |
|---|---|---|
| Render Free web service | Sleeps after 15 minutes without inbound traffic; 750 free instance hours/workspace/month; local filesystem is ephemeral | Cold starts and shared-hour exhaustion affect demos; do not store durable data locally or depend on free service for timely jobs. Move to always-on paid instance/worker or justified alternative for reliable background work |
| Vercel Hobby | Limited to personal non-commercial use | A commercial SaaS deployment requires eligible paid plan. Recheck current request/compute/build/bandwidth quotas before deployment; no production capacity promised |
| Neon Free | Official recent announcement reports 100 projects, 1 GB storage/project and 100 CU-hours/project/month; older official pages differ | Recheck dashboard/current plan at provisioning; budget compute, storage, connections, egress, branches and restore limits. Scale-to-zero can add latency; upgrade/migrate when backup, uptime or quotas require it |
| OIDC/AI/GitHub Actions | No provider/plan-specific capacity accepted here | Verify active-user/email quotas, token/request budgets and CI minutes/storage for chosen account; no assumption that free service lasts indefinitely |

Sources checked during Phase 0:
- [Render free service limits](https://render.com/docs/free) and [ephemeral filesystem FAQ](https://render.com/docs/faq).
- [Vercel Hobby eligibility](https://vercel.com/docs/plans/hobby) and [fair-use rules](https://vercel.com/docs/limits/fair-use-guidelines).
- [Neon recent free-plan announcement](https://neon.com/blog/neon-free-plan-1-gb-per-project). Current pricing page could not be fetched successfully by the research tool, so account-specific quotas, connection limits, restore windows and egress entitlements are unresolved. Do not rely on older search snippets.
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) and [Prisma transactions](https://www.prisma.io/docs/orm/fundamentals/transactions) support the implementation considerations in domain-model.md.

Free tier is a development convenience, not a production SLA or permanent entitlement. Trigger migration at commercial use, reliable unattended jobs, sustained quota pressure, required backup/restore guarantees or data-residency constraints. Preserve portable PostgreSQL backups and stateless services; estimate budget before changing plans.

## AD-14 Consequential plan edits
Selected: all structural/schedule/priority mutations go through ActionProposal initially, including manual task creation; factual observed progress is a separately authorized revisioned update. Alternatives: conditional approval only above threshold, direct CRUD with scattered gates. Rationale: one reviewable write path avoids bypasses; materiality policy still records business impact. Trade-off: extra clicks and need for independent approver, particularly for initial plan creation. Revisit low-risk batching or delegated bounded auto-approval only after explicit product decision and threat review; never silently bypass.

## Outstanding review decisions
OIDC/AI provider, exact versions, commercial budget, deployment region, RLS proof outcome, retention/restore needs, approver availability, admin visibility, material threshold and simulation assumptions. None prevents completing the planning documents; dependent implementation must resolve them before use.
