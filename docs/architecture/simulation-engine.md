# ProjectOS — Deterministic what-if simulation
Design only. Results are estimates conditional on inputs, never precise promises of delivery.

## Inputs and snapshots
Simulation captures tenant/project, planRevision, startDate, explicit asOf working-day offset, targets, tasks, dependency edges, milestone associations, project capacity, calendarVersion and engineVersion in one consistent read. Completed tasks include actualFinishOffset; active tasks have remainingEffortDays, resourceUnits and releaseOffset. Progress percentages are display facts, not a formula for remaining effort.
Overrides support remaining effort (duration at one unit), units allocated per task, total staffing capacity, dependency add/remove and project/milestone targets. No override changes live records. All task/edge/milestone IDs are validated against the captured project.
Initial calendar: Monday–Friday, no holidays, integer working days, day 0 at project start; half-open intervals [start,finish). A finish at offset 3 is the boundary after three working days; UI says “finish boundary” to avoid inclusive-date ambiguity. Dates/offsets use one versioned timezone/calendar conversion; calculations never read the current clock implicitly.

## Feasible v1 algorithm
1. Validate task bounds, finite integer values, units ≤ capacity, same-project dependencies, no duplicates/self-edges, target dates and graph size. Kahn topological sort rejects cycles and reports authorized edge IDs only.
2. Completed tasks are fixed at recorded finish and consume no future capacity. Active tasks cannot begin before asOf. Reject impossible snapshots where a completed successor precedes an unfinished predecessor; historical inconsistencies require correction, not invented dates.
3. Effective duration for active task = ceil(remainingEffortDays/resourceUnits). Assumption: homogeneous, divisible effort with linear speedup and integer rounding. It is deliberately simple; units are generic capacity, not inferred individual productivity.
4. Compute precedence-only earliest starts/finishes: ES=max(asOf,releaseOffset,max predecessor EF), EF=ES+duration. For completed predecessors use actual finish.
5. Compute precedence-only latest starts backward from unconstrained completion; precedenceSlack=LS−ES. Label this explicitly as precedence slack, not a full resource-constrained critical path.
6. Resource-constrained serial schedule generation: among dependency-ready unscheduled tasks, choose ascending precedenceSlack, then releaseOffset, then canonical task ID. Find earliest integer start ≥ release/asOf/all scheduled predecessor finishes with resourceUnits available on every day of its non-preemptive interval. Reserve capacity; repeat. Zero-effort tasks finish immediately and consume no capacity.
7. Milestone completion is max finish of its associated tasks; empty milestone is unknown/null. Project completion is max task finish (empty project=asOf). Lateness=max(0,completion−targetOffset); missing target gives null. Changing deadlines changes lateness/risk, not calculated effort.
8. Return task intervals, completion, milestone dates/lateness, precedence slack and deterministic delay reasons: dependency, release constraint, capacity, effort/unit override or unchanged.
Topological pass O(V+E); bounded day-slot allocation approximately O(V × horizon × duration), acceptable only under caps. Proposed horizon ≤3,650 working days and tasks ≤500/edges ≤2,000; reject exceeding horizon rather than unbounded search. Optimize only after profiling. No stochastic components.

## Reproducibility and persistence
Canonicalize IDs/keys and edge order; hash snapshot+overrides+engineVersion+calendarVersion. Store integer inputs, results, inputHash and resultHash. asOf is part of input. Scheduling must be independent of locale, database iteration order, wall clock and AI output. Repeated jobs can have different IDs/timestamps but identical calculated output hashes. Retain engine versions or immutable fixtures for historical interpretation; no silent recomputation under new algorithm.
Baseline and scenario each run through the same algorithm on the same captured snapshot, with only explicit overrides differing. Simulations store both outputs; live changes make the scenario stale relative to live plan but do not alter historical comparison.

## Worked hypothetical example
Calendar start Monday 2026-10-12, asOf=0, capacity=2, each task uses 1 unit. All work is remaining; no release delays. Milestone Release contains task D and has target finish boundary offset 8 (2026-10-22).
| Task | Predecessors | Baseline effort/duration | Baseline [start,finish) | Scenario duration | Scenario [start,finish) |
|---|---|---:|---|---:|---|
| A Design | none | 2 | [0,2) | 2 | [0,2) |
| B Build API | A | 3 | [2,5) | 5 | [2,7) |
| C Build UI | A | 2 | [2,4) | 2 | [2,4) |
| D Integration | B,C | 2 | [5,7) | 2 | [7,9) |
Baseline completion offset 7 = finish boundary Wednesday 2026-10-21. Scenario changes B effort 3→5, completion offset 9 = Friday 2026-10-23. Delta +2 working days; milestone lateness 0→1 day. B delays D because D waits for both B and C. Unchanged C does not offset B's delay.
Independent staffing scenario with baseline effort and capacity 1: stable priority schedules A [0,2), B [2,5), C [5,7), D [7,9), completion 9. This illustrates capacity delays without claiming optimal scheduling.
Changing only target offset 8→10 leaves completion unchanged but changes measured lateness. Removing a valid dependency may accelerate a task; adding D→A creates a cycle and returns 422, with no stored successful result.

## Comparison and application
Comparison includes completion/milestone deltas, changed task IDs, target changes, capacity effects, assumptions and stale flag. AI optionally converts these verified facts into readable explanations with fact references; reject invented numbers.
An authorized PM can request a proposal from a successful scenario. Server derives exact allowlisted plan delta from stored overrides, checks current live revision equals captured revision, calculates impact and creates immutable proposal. Independent Owner/Admin approval and execution-time authorization are required. A stale scenario must be rerun on a fresh snapshot; no automatic rebase or silent merging. Simulation rows never mutate Task/Dependency/Project records.

## Limitations and edge cases
No individual skills, leave, holidays, overtime, uncertain effort distributions, cross-project resource contention, lead/lag, start-to-start links or preemption in v1. Serial schedule is deterministic and feasible, not guaranteed optimal. Linear speedup can overestimate staffing benefits; UI must show the assumption beside capacity controls. Missing/contradictory data blocks calculation or returns explicit unknown metrics. Completed-task corrections require controlled factual update and a new revision. Future richer calendars/resources require engine version change and new acceptance fixtures.
