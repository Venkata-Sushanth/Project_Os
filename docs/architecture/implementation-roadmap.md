# ProjectOS — Fixed implementation roadmap
The user's Phase 1 instructions establish the following fixed phases. This replaces the earlier implementation-batch ordering without removing the approved architecture. Phase 1 is a presentation foundation; the interactive mock prototype belongs to Phase 2.

| Phase | Objective | Prerequisites | Deliverables / modules | Verification and exit criteria | Risks / dependencies |
|---|---|---|---|---|---|
| 0 | Architecture and planning | Supplied baseline | docs/architecture | Eleven coherent planning documents | Product assumptions reviewed before dependent work |
| 1 | Frontend foundation and premium UI | Explicit Phase 1 authorization | Next.js shell, routes, presentation components, design tokens | Cloud lint/typecheck/build; responsive and keyboard review where available; GitHub delivery | Cloud access and Vercel settings; no business functionality |
| 2 | Interactive frontend prototype using mock data | Explicit Phase 2 authorization; Phase 1 foundation | Typed client boundary, replaceable mock adapter, synthetic fixtures and interactive views | Contract-shaped mock scenarios, clear demo labels and error states | No fake claims of backend security |
| 3 | Backend and security foundation | Approved contracts and provider choices | Separate TypeScript API, identity, tenancy, authorization, persistence setup | Isolation, session, FK and planned RLS/pooling tests | Provider selection, runtime credentials, cloud provisioning authorization |
| 4 | Tenant-aware project domain and API integration | Phase 3 security | Projects, tasks, milestones, dependencies and membership APIs; HTTP adapter | Cross-tenant/resource tests, contract tests and graph integrity | Revocation and concurrency |
| 5 | AI Policy and Workflow Engine | Domain and authorization | Structured versioned policies, deterministic validation/evaluation, proposals, approval and execution | Unsafe AI rejection, independent approval, replay/stale checks | Provider budget and prompt safety |
| 6 | Deterministic What-If Simulation Engine | Project snapshots and approval pipeline | Versioned deterministic scheduler, scenario comparison, approved application | Worked fixture, reproducibility, cycle rejection, live-data isolation | Capacity/calendar assumptions |
| 7 | Predictive Project Risk Intelligence and Intelligent Task Prioritization | Verified project facts and scenario outputs | Risk/prioritization feature modules and evidence views | Validate against agreed evaluation data; distinguish heuristic facts from validated predictive models | No unsupported accuracy claims; model/data requirements remain to be specified |
| 8 | Project Intelligence Assistant | Scoped evidence and permission checks | Assistant UI and backend provider adapter | Evidence grounding, tenant leakage and unsafe-action tests | No independent authority or unrestricted database tools |
| 9 | End-to-end integration, testing, and security hardening | Phases 1–8 | Full flow tests, observability, job recovery and audits | Negative tenant tests, accessibility, performance and recovery gates | Address all release-blocking defects |
| 10 | Cloud deployment, evaluation, and final demonstration | Release review and explicit infrastructure authorization | Production topology, runbooks, demonstration evidence | Verified deployment, backup/restore, budget and evaluation report | Free tiers are not production guarantees |

## Phase 1 reviewable batches
1. Inspect existing repo and preserve user files.
2. Establish minimal strict Next.js/React/Tailwind configuration.
3. Build shell/navigation, reusable controls and lightweight future-feature pages.
4. Run checks in authorized cloud tooling and inspect available browser preview.
5. Review intended changes, commit/push without force, verify remote SHA and deployment separately.
Stop. Phase 2 requires explicit authorization.

## Continuing architectural gates
Every tenant request and background job verifies membership and resource permission. AI never authorizes writes or computes schedules. Consequential actions require immutable proposal approval and execution-time checks. Simulation results never mutate live plans. These requirements survive the phase reorder.

## Review items
Confirm role/admin visibility, approval defaults, OIDC/AI provider, material-delay threshold, calendar/capacity assumptions, region, retention and production budget. Predictive-model evaluation and assistant detailed contracts will be specified in their future phases, preserving evidence and authorization boundaries.
