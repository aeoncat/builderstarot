# Recommendation: focus the global header during a Project reading

_Status: documented recommendation only — intentionally **not** implemented on
`feat/project-reading-showcase-polish`._

## Context

The global header ([`components/layout/site-nav.tsx`](../components/layout/site-nav.tsx))
exposes ten destinations. Below the `xl` breakpoint it already collapses into a
single hamburger menu (a clean, focused state — good on mobile). At `xl` and
above, all ten links render inline, which competes for attention while a user is
completing the Project Stage Reading golden path.

The polish brief asked for the **smallest** change that keeps every route
reachable but makes the Project workflow feel focused, and explicitly permitted
documenting a recommendation instead of forcing a risky change.

## Why no change was made in this branch

`SiteNav` is a shared, global component. Any change to it affects every page,
and this branch ships right before a live seven-minute demo. Every option that
would actually reduce the desktop link count carries avoidable demo risk:

- **Route-aware nav** (hide/demote secondary links on `/readings/project-stage`)
  couples a global component to one page's flow and adds conditional rendering
  paths that are easy to get subtly wrong under time pressure.
- **Moving links into an overflow/"More" menu** is a genuine navigation redesign
  and changes behavior on every route, not just the reading.
- **Reordering or de-emphasizing links globally** risks the muscle memory the
  presenter relies on during the demo.

None of these are worth the regression surface for a presentation branch, so the
scannability win was invested where it is safe and on-path instead: the "Start
here" hero, the calmer card hierarchy, and human-readable journal titles.

## Recommended change (post-demo)

Introduce an explicit, opt-in **focus mode** for active readings rather than
touching the default nav:

1. Keep the current header as the default everywhere.
2. On `/readings/project-stage`, once a reading has been drawn
   (`flowStep === "reading"`), render the primary golden-path destinations inline
   (Project, Journal, Home) and move the rest behind the **existing** hamburger
   toggle — reusing the responsive pattern that already ships, not a new one.
3. Gate it behind the reading state so other pages are untouched, and verify the
   hamburger still exposes all ten routes for keyboard and screen-reader users.

This keeps every route reachable, reuses a shipped overflow pattern, and can be
built and verified without the time pressure of demo day.
