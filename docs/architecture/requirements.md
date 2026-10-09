# ProjectOS — Product requirements
Status: Phase 0 proposal for review; no application capabilities are implemented.
Date: 2026-10-10. Organization and Tenant refer to the same isolation boundary.

## Baseline and repository inspection
The subsequently supplied “ProjectOS — Phase 0 Baseline” is the primary requirements baseline, together with the original detailed Phase 0 execution instructions. Both were read in full. The new baseline resolves the initially missing-input limitation. This document preserves the six named roles, all eight core capabilities, selected technology, mock-first Phase 1, and planning-only boundary.
Read-only GitHub inspection found Venkata-Sushanth/Project_Os empty, with main as the default branch; contents returned “This repository is empty.” There were no source files, conventions, existing implementation, or repository instructions to preserve. The chat workspace contained only work/ and outputs/. These documents are the first repository content.

## Vision and users
Help organizations coordinate project delivery, explain risks with evidence, test alternative plans safely, and apply accountable policy-driven changes. Success is a demonstrable authorized event → policy → proposal → independent approval → execution path, alongside a reproducible baseline-versus-scenario simulation.
Target use cases: a consultancy separating client organizations; a delivery team managing dependencies and milestones; an organization owner governing access; a stakeholder reviewing progress. These are illustrative contexts, not confirmed customer segments.

## Role and permission model
A global User can have many Membership records, one per Tenant. Membership holds one organization role: Owner, Admin, or Member. ProjectMember holds one project role: Project Manager, Team Member, or Viewer / Stakeholder. This normalization preserves all six named roles without making project authority organization-wide.
Platform Super Admin is a separate global assignment, with tenant/account suspension and platform operational metadata only. It grants no access to tenant project content, policy execution, or tenant approvals. No impersonation or break-glass content access in the initial release.
Owner and Admin inherit management and read access to projects in their tenant. A Member needs an active ProjectMember to see a project. Project Manager status applies only to assigned projects. Viewer cannot mutate.

| Permission code | Eligible roles and conditions |
|---|---|
| platform.manage | Platform Super Admin; separate platform surface |
| org.manage | Owner; Admin may edit name/timezone and ordinary memberships, not owners or admin grants |
| org.owner | Owner only; owner/admin grants, owner transfer, tenant archival; never remove the last active Owner |
| org.read | Any active tenant member; limited org metadata |
| project.create | Owner/Admin; creator selects active tenant members as project managers |
| project.read | Owner/Admin or active ProjectMember |
| project.manage | Owner/Admin or Project Manager on that project |
| task.contribute | project.manage or Team Member; Team Member updates assigned-task progress, creates project comments and edits own comments |
| policy.manage | project.manage; policy publication requires valid immutable version |
| simulation.run | project.manage or Team Member; read access to whole target project required |
| insight.read | project.read |
| proposal.create | project.manage; simulation read/run alone does not authorize applying a scenario |
| proposal.approve | Owner/Admin; must differ from proposer and have project access |
| proposal.execute | project.manage; original proposer must remain authorized too |
| audit.read | Owner/Admin across tenant; Project Manager only their project's business events |
| notification.self | Active member; own notifications only |

Fixed roles are the initial scope; custom roles are deferred. Server-side checks are authoritative. Role downgrade, suspension, or membership removal takes effect on the next request and before queued execution. UI permission hints never replace these checks. See [security design](security-design.md).

## Requirements and measurable acceptance
| ID | Requirement | Initial demonstrable acceptance |
|---|---|---|
| FR-01 | Authentication, suspension and organization selection | User signs in, sees only active memberships, switches organizations; a suspended user or tenant cannot access tenant APIs |
| FR-02 | Memberships, invitations and scoped roles | Owner invites verified email, token expires/redeems once; same user is PM in A and Viewer in B with distinct permissions |
| FR-03 | Projects, milestones, tasks, dependencies, comments, progress | PM creates a small dependency plan; cycles and cross-project links rejected; Team Member updates assigned progress; Viewer reads |
| FR-04 | AI Policy and Workflow Engine | Natural language yields an untrusted candidate; schema/semantic validation, immutable publication, deterministic evaluation, proposal approval and audited allowlisted execution all demonstrated |
| FR-05 | Deterministic What-If Simulation Engine | Duration, dependency, capacity and target-date overrides calculated from immutable snapshot; equal canonical inputs produce equal result hashes; live plan unchanged |
| FR-06 | AI-Assisted Project Intelligence | Deterministic risk, bottleneck and priority facts are displayed with resource references; AI summary cites supplied evidence or is rejected; provider outage leaves facts available |
| FR-07 | Secure Multi-Tenant SaaS Architecture | Two-tenant negative tests pass for resources, nested joins, jobs, notifications, audit records and AI context |
| FR-08 | Approval governance | Consequential proposals require independent approval; stale/replayed/expired proposals cannot execute; authority rechecked transactionally |
| FR-09 | Audit and notifications | Significant changes include tenant, actor and correlation IDs; authorized notification recipient sees in-app escalation; audit is append-only for runtime |
| FR-10 | Cloud-first delivery | Future CI validates contracts, domain logic and security; development/staging/production separated; no deployment in Phase 0 |
| FR-11 | Plan application | Scenario creates a reviewable immutable delta proposal; authorized approved execution changes the live revision atomically, never by writing Simulation rows into Task rows |

## Initial scope and sequencing
Demonstrate two tenants, six roles, a project with four or more dependent tasks, all three example policies, an approval inbox, and baseline/scenario comparison. Policy intelligence and simulations enter the first vertical slice, before extensive CRUD polish.
All major capability areas remain in architectural scope. Initial delivery uses one project per simulation, finish-to-start dependencies, a working-day calendar, fixed role sets, in-app notifications, bounded policy expressions, and a deterministic single-pool capacity model. Tenant-wide policies, advanced calendars and external notification channels are extensions, not implied initial features.
Out of initial scope: billing, marketplace, mobile-native clients, public sharing, file uploads/exports, SSO/SAML provisioning, arbitrary scripts/SQL, cross-project dependency networks, Monte Carlo forecasts, skills optimization, real-time collaboration, automatic unapproved plan changes and custom RBAC. Future file/export access must obey the same security invariants.

## Non-functional targets (proposed, requiring review)
- Correctness/security: zero known cross-tenant reads/writes; all consequential execution passes the fixed approval gate.
- Performance: warm API p95 below 500 ms for ordinary operations at 20 concurrent demo users; simulation below 5 s for 500 tasks/2,000 edges on agreed reference hardware. AI requests separately budgeted at 20 s; cold starts excluded and disclosed.
- Capacity limits: 500 tasks/project, 2,000 dependencies/project, 50 active policy versions/project, 20 predicates/policy and 5 proposed actions/evaluation in demo; reject oversized requests before work.
- Accessibility: WCAG 2.2 AA target, keyboard workflows, visible focus, non-color-only status, reduced motion.
- Reliability: no production SLA on free development tiers; idempotent mutations, durable job state and recoverable retries. Production RPO ≤24 h and RTO ≤4 h are review targets contingent on backup/restore tests and funded hosting.
- Maintainability: typed versioned contracts, isolated domain functions, provider adapters, repeatable CI.
- Privacy: minimum AI data, no tokens in logs, tenant-specific retention and deletion procedure; no legal compliance certification claimed.

## Assumptions and review register
| ID | Default | Trade-off / outstanding decision |
|---|---|---|
| A-01 | Use the supplied ProjectOS — Phase 0 Baseline plus original detailed instructions | Resolved input gap; no remaining missing-baseline blocker |
| A-02 | Fixed org and project roles as above | Easier enforcement; confirm admin visibility into all tenant projects |
| A-03 | Owner/Admin independent approval, one approver, seven-day expiry | Demo needs two authorized people; no self-approval shortcut even for sole owner |
| A-04 | Material deadline change = completion moves ≥2 working days OR a previously met target becomes missed | Product threshold needs approval; all plan mutations use proposals initially, simplifying enforcement |
| A-05 | Mon–Fri, no holidays; integer remaining effort/duration; one fungible capacity pool | Feasible reproducible estimates, not precise forecasts of real delivery |
| A-06 | Managed OIDC identity provider, backend-owned sessions via frontend proxy | Select provider, quotas, email delivery and recovery UX before auth implementation |
| A-07 | 90-day simulation/insight retention; 365-day audit/execution retention | Proposed operational defaults, not legal retention requirements; deletion policy needs owner approval |
| A-08 | Single region, synthetic demo data initially | Region/data residency and AI provider retention terms unresolved |
| A-09 | Public empty repository is the intended ProjectOS repository | Planning documents contain no credentials or private business data |
| A-10 | Development hosting only until explicit release decision | Budget, domains, always-on worker and commercial plan eligibility unresolved |

Dependencies: GitHub access, future OIDC provider, managed PostgreSQL, optional AI provider and later cloud accounts. Primary risks: role ambiguity, approval deadlock, stale snapshots, provider leakage, free-tier suspension, inaccurate input data and underestimated capacity constraints.
See [decisions](architecture-decisions.md), [API contracts](api-contracts.md) and [roadmap](implementation-roadmap.md). Phase 1 requires explicit user review and authorization.
