# ProjectOS
AI-assisted multi-tenant project management platform.

## Current release
Phase 1: frontend foundation only. Next.js, React, strict TypeScript, Tailwind CSS and Lucide. The application renders without environment variables, a backend, a database or an AI provider.

Implemented: responsive application shell, grouped navigation, page finder (navigation only), preview organization contexts, shared presentation components, overview and clearly labelled future-feature pages. No mock business metrics or functional project workflows.

## Cloud-only development
Run dependency installation, lint, type-check and production build in an authorized cloud workspace. Do not run development commands on the user's laptop.
Vercel Git integration reads vercel.json and runs npm install followed by npm run verify, which executes lint, TypeScript and the production build. A successful deployment must be checked separately from GitHub delivery.
No secrets are required. .env.example deliberately contains no credential fields.

## Routes
Root redirects to /o/preview. Organization contexts are route parameters, not authorization.
- /organizations, /login, /auth/error, /invite, /o/new, /platform
- /o/[tenantId]: overview
- /o/[tenantId]/{projects,tasks,team,insights,policies,workflows,simulations,approvals,audit,notifications,settings}
- /o/[tenantId]/p/[projectId] with overview, tasks, milestones, dependencies, team, insights, policies, workflows, simulations, proposals and assistant layouts
- Nested task, workflow, simulation and proposal detail routes; policy editor/version routes; simulation new route
Unknown route shapes return 404. IDs in preview URLs represent layout context only.

## Structure
src/app: routes and boundary states. src/components: shell and reusable presentation. src/lib/navigation.ts: typed page and navigation definitions. No business rules or security enforcement in visual components.
See docs/architecture and docs/phase-1 for scope and verification. Phase 2 requires explicit authorization.
