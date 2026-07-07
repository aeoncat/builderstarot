# Phase 2 notes (deferred from Phase 1)

Recorded during the Phase 1 card-content migration. Nothing here is implemented
yet; Phase 1 made no runtime or reading-output changes.

## Reflection-question rotation

`emphasisText(content, "questions")` currently returns `content.questions[0]`,
and `RoleFrameInput.question` is always the first question. Phase 2 should make
question selection **deterministic but capable of choosing either question**,
seeded by `cardSlug + role + orientation` (same seed source as frame selection),
so a card with two questions can surface its second one and multi-card readings
vary which question they raise. Do not change this in Phase 1.

## Cross-product render test matrix (build in Phase 2, alongside the renderer)

When the interpretation renderer exists, add a matrix test over:

- every card in `CARD_CONTENTS`
- both orientations (upright, reversed)
- every **compatible** role for that draw (all roles are compatible with all
  cards under the current model; document any future compatibility constraints
  here if that changes)
- every frame in that role's pool

For each combination assert:

1. **Valid grammar** — no double spaces, no `undefined`/`null`, no doubled
   punctuation; sentences begin uppercase and end with terminal punctuation;
   `tension`/`warning` clauses compose cleanly into their host frames.
2. **Non-empty output** — rendered length above a sane floor.
3. **Determinism** — identical (card, orientation, role, seed) → identical string.
4. **Frame compatibility** — the frame only references emphasis fields the role
   declares (`primary`/`secondary`), and renders cleanly for both orientations.

This supersedes the Phase 1 `chooseFrame` variety test once the real renderer
drives frame selection.

## Card display-name candidates (revisit after the Phase 3 slug migration)

Do **not** rename any card during Phase 1 — the database still joins on `name`.
Once `Card.slug` is the stable identity (Phase 3), reconsider display names.

- **The Co-Founder** — content was authored broadly to cover partners, clients,
  collaborators, communities, and the relationships around the work, but the
  name still implies co-foundership specifically. Candidate future display
  names: "The Ally", "The Partnership", "The Alliance". Slug `the-co-founder`
  stays fixed regardless of display name.
