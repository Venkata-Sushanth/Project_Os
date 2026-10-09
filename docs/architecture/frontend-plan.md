# ProjectOS — Frontend information architecture and UX plan
Phase 1 is a future mock-data prototype, not begun here. Stack: Next.js, React, TypeScript, Tailwind CSS.

## Navigation and layout
Global shell: organization switcher, project selector, notifications and profile. Tenant navigation: Dashboard, Projects, Approvals, Team, Audit, Settings. Project navigation: Overview, Tasks, Milestones, Dependencies, Insights, Policies, Workflows, Simulations. Platform operations appears only to Platform Super Admin and is a separate metadata-only area.
URL tenant/project selectors support deep links but grant no permission. Organization switching cancels in-flight requests, clears tenant draft/cache state after unsaved-change warning, and routes to the new dashboard. Browser back navigation cannot reuse another tenant's sensitive cache.
Desktop: restrained sidebar, top contextual heading, main content and optional task detail drawer. Mobile: navigation drawer, stacked comparison sections, horizontally scrollable accessible data tables and list alternative for dependency graph. No hover-only critical actions.

## Page inventory
Roles below inherit [requirements](requirements.md). “Reader” means project.read, including Viewer.
| Screen / proposed route | Purpose and primary actions | Roles | Data and navigation |
|---|---|---|---|
| /login, /auth/error | Sign in, retry provider failure, explain expiry | Public | OIDC redirect state; return to organization selector |
| /organizations | Select or create organization | Signed-in User | /me memberships; create Tenant; enters /o/{tenantId} |
| /o/new | Organization onboarding | Active User | name/slug/timezone; creates first Owner; next invite team |
| /o/{t} | Dashboard and progress reporting | Active membership | Visible projects, authorized insight/progress summaries, own notifications; links to project and approvals |
| /o/{t}/settings | Name/timezone, owner transfer | Owner/Admin, owner-only transfer | Tenant revision, membership choices; recent reauth and transfer confirmation |
| /o/{t}/team | Organization membership/invitations | Members directory; Owner/Admin manage | Member/Invitation DTOs; status/role badges; no leaked email to ordinary members |
| /invite | Accept invitation | Signed-in verified invitee | One-use token; acceptance result, expiry/revoked state; organization link |
| /o/{t}/projects | Filter/list/create projects | Reader; Owner/Admin create | Project page DTOs; create modal; links project overview |
| /o/{t}/p/{p} | Project overview, progress, targets, activity | Reader; PM manages metadata | Project, Milestone, Insight, Workflow summaries; explicit stale dates |
| .../team | Project roles and assignments | Reader; PM manages | ProjectMember and tenant directory; grant/remove role feedback |
| .../tasks | Task list/board; propose new task or plan edit | Reader; PM proposes; Team contributes | Paginated Task DTO; filters; detail drawer; proposal confirmation for structural edits |
| .../tasks/{id} | Task detail, actual progress, comments | Reader; assignee/PM progress; Team comments | Task, dependencies, comments; distinguishes observed progress from proposed plan |
| .../milestones | Milestone targets/forecast; propose edits | Reader; PM proposes | Milestone + calculated output; target and forecast visually separate |
| .../dependencies | Graph/table dependencies; propose changes | Reader; PM proposes | Complete paginated edge set; cycle errors next to offending edges; task links |
| .../insights | Risk explanations, bottlenecks, priority recommendations, progress | Reader | Insight facts/evidence/asOf/revision; trigger refresh within quota; links evidence tasks |
| .../policies | Policy list/create/disable | Reader; PM manages | Policy status/version; editor and history links |
| .../policies/{id}/edit | Natural-language input, candidate review, structured correction | PM | Interpretation/PolicyVersion/ValidationReport; save new version; no auto-publish |
| .../policies/{id}/versions | Immutable history/diff/validation/publish | Reader; PM publishes | Version definition/hash/reports; confirmation shows effective actions and approval gates |
| .../workflows and .../workflows/{id} | Explain matched/skipped/failed execution | Reader | Execution/event/facts/proposal links; timeline shows approval and actual execution separately |
| .../simulations/new | Snapshot, change effort/dependencies/capacity/targets | PM/Team | Project revision and plan; assumptions panel; validate then run; no live-save control |
| .../simulations and .../simulations/{id} | History, status and baseline/scenario comparison | Reader; PM proposes application | Simulation/Comparison DTO; delta table, timeline, stale banner; create proposal |
| /o/{t}/approvals and .../p/{p}/proposals/{id} | Review exact changes, decide, execute | Eligible Owner/Admin decide; PM executes | Proposal/hash/impact/expiry/revision; self-approval disabled with reason; decision and execution separate |
| /o/{t}/audit | Search trace of authorized changes | Owner/Admin; PM project subset | AuditEvent list/date filters; deep link targets only when accessible |
| /o/{t}/notifications | Own in-app notifications | Active member | Notification DTO, unread toggle; redacted unavailable targets |
| /platform | Tenant/account status controls | Platform Super Admin | Operational metadata and ID-based account suspension; no project content |

## Interaction states and design system
Each remote view has skeleton/loading, empty-with-permitted-next-action, inline validation, retriable network error, unauthorized/expired session, suspended tenant and stale-revision states. Long runs show queued/running/failed with polling backoff, never fabricated progress percentages. Do not show toast-only validation for failed approvals. On 409 preserve user draft and offer refresh/review; never auto-resubmit consequential actions.
Use semantic spacing/typography/color tokens, neutral surfaces and a single accent. Status combines text/icon/color. Reusable components: AppShell, OrgSwitcher, PermissionBoundary (presentation only), DataTable, FilterBar, FormField, StatusBadge, TaskDrawer, EvidenceLink, ValidationPanel, VersionDiff, ScheduleComparison, ApprovalDecisionPanel, EmptyState and ErrorPanel.
Keyboard-focus restoration for drawers/modals; accessible table headings, visible labels, contrast checks, screen-reader announcements for job completion, reduced motion and graph table alternatives. Destructive/privilege operations name their target; ordinary navigation remains lightweight.

## Typed data boundary and mock transition
Future packages/contracts holds DTOs and request/error schemas from API design; frontend features depend on a typed ProjectOSClient interface, not fetch or fixture imports. Two adapters implement it: MockProjectOSClient and HttpProjectOSClient. Selection is environment configuration at composition root. View models may format dates but cannot recalculate authoritative policy or schedule results.
Mock adapter returns contract-shaped synthetic fixtures for two tenants with different roles, pending/stale/denied/failed states, three policies and worked simulation. It mimics pagination, delays and error codes. Mock auth is visibly labeled “Demo data”; it is never a production fallback. Contract tests later run against both adapters. Http adapter centralizes credentials, CSRF, tenant route construction, cancellation, pagination and safe errors. Query keys include user/tenant/project; switch/logout invalidates them.
No client-side secret, provider SDK, ORM or authoritative permission evaluator. UI controls expose server-returned capabilities for usability, but backend checks remain mandatory. Phase 1 produces mock views only after explicit authorization.
