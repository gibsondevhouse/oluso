# 01 — ADAMA HSE product vision

Status: Governing
Last updated: 2026-07-18

## Vision

ADAMA HSE will be the dependable local operating system for plant baseline knowledge and occupational-exposure management.

It should answer, for a worker or SEG:

> What work do they perform, where do they perform it, what agents may expose them, under which conditions, what controls apply, what evidence supports the conclusion, and what needs to happen next?

## Desired outcome

The product should turn a plant walkthrough, professional assessment, sampling history, manager review, and corrective-action loop into connected records that remain understandable over time.

The most important product experience is not a collection of register pages. It is continuity across:

```text
Operational context
  → Exposure scenario
  → Assessment and uncertainty
  → Monitoring decision
  → Professional determination
  → Controls and actions
  → Verification and reassessment
```

## Product character

ADAMA HSE should feel:

- Calm, serious, and field-oriented.
- Dense enough for professional comparison but easy to scan.
- Explicit about missing, unknown, stale, and conflicting information.
- Traceable without requiring users to reconstruct history from files or memory.
- Local and resilient without pretending to offer invisible sync.
- Supportive of professional judgment without automating it away.

## Collaboration vision

Two people must be able to work from separate local copies without silently discarding either person’s changes.

The product will achieve this through visible exchange packages:

1. A user exports changes against a known dataset revision.
2. The other installation validates the package and previews classifications.
3. The reviewer accepts safe changes and resolves conflicts explicitly.
4. The system records the import, review notes, resolutions, and resulting record revisions.
5. A future exchange can distinguish those accepted revisions from new local work.

This is deliberate asynchronous review, not real-time coauthoring.

## Near-term product promise

For a site or unit, the dashboard will show baseline completeness instead of generic activity counts. A user should immediately see which processes, tasks, chemical uses, SEGs, scenarios, controls, monitoring records, and reassessment dates are incomplete.

## Long-term boundary

ADAMA HSE may eventually reactivate training, MOC/PSSR, environmental, permit, and broader compliance capabilities. Those modules must reuse the canonical location, people, action, evidence, revision, and exchange models. They do not justify weakening the current scope.

The product will not become a regulatory interpretation engine, clinical record system, generic workflow builder, or cloud SaaS platform unless a future decision explicitly changes the intended use and architecture.
