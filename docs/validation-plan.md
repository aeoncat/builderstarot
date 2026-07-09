# Builder's Tarot — Validation Phase Plan

Goal: answer two questions with behavioral evidence over ~30 days:
1. Do people use Builder's Tarot repeatedly?
2. Do engaged users show meaningful interest in paying for Pro?

No payments are collected in this phase. Pro is clearly labeled as planned.

## Event vocabulary

Defined and enforced in `lib/analytics/events.ts` (strict zod; unapproved
names/props are rejected server-side). Events carry a pseudonymous visitor id
(random UUID in localStorage) and the internal user id when authenticated —
never emails, raw context, reading text, journal notes, IPs, or free text.
Retention: raw events pruned after 180 days (opportunistic, on write).

| Event | Fired when | Key props |
|---|---|---|
| landing_viewed | Home page mount (once/session) | — |
| account_created | Successful signup | authed |
| reading_started | Draw initiated (single/spreads) | surface, spreadSize, authed |
| reading_completed | Interpretation displayed | surface, spreadSize, authed, reversedCount |
| project_reading_started | Project draw submitted | stage, authed |
| project_reading_completed | Project interpretation displayed | surface, stage, authed, reversedCount |
| journal_entry_saved | Reading saved to journal | surface, stage, authed, hasSnapshot |
| journal_entry_viewed | Journal entry opened (once/entry/session) | hasSnapshot |
| return_visit | First activity on a new calendar day | — |
| pro_page_viewed | /pro mount (once/session) | — |
| pro_plan_selected | Plan option clicked (pre-email) | plan |
| pro_waitlist_started | Waitlist email field focused | plan |
| pro_waitlist_joined | Waitlist POST succeeded | plan |
| interview_interest_submitted | Interview opt-in (survey or waitlist) | source |
| validation_survey_viewed / _completed | Survey shown / submitted | — |

Mapping note: "project reading saved" = `journal_entry_saved{surface:"project-stage"}`;
"saved project reading reopened" = `journal_entry_viewed{hasSnapshot:true}`.

Completion rules: a reading counts as completed only when the final
interpretation renders. Failed requests, abandoned setup, page loads, and
StrictMode/rerender duplicates never count (session-scoped once-keys in
`lib/analytics/visitor.ts`).

## Identity

- Guests: random UUID in localStorage (`bt_vid`). No fingerprinting/IP/location.
- Authenticated: events also carry the internal user id (never the email).
- Merge: the visitor id persists across signup, so guest history and account
  history share one identity in metrics (see `identity()` in metrics.ts).
- Account deletion: no self-serve deletion flow exists yet; when one is built,
  delete `ProductEvent` rows by userId. Documented as a pre-launch task.

## Metric formulas (implemented in `lib/analytics/metrics.ts`)

- **Unique visitors** = distinct identities with ≥1 event in range.
- **First-reading completion** = identities with ≥1 completed reading ÷ unique visitors.
- **Project-reading completion** = identities completing ÷ identities starting.
- **Median time to first reading** = median(first completed reading − first event) per identity.
- **Dn retention** = among identities whose full window has elapsed (asOf past
  the end of day first-seen+n), share with any event on a day in
  [first-seen+1, first-seen+n].
- **Weekly returning readers** = identities with completed readings on ≥2
  distinct days within the rolling 7-day window.
- **≥3 readings** = identities with ≥3 completed readings (any surface).
- **Journal-save rate** = identities that saved ÷ identities that completed a reading.
- **Plan distribution** = last `pro_plan_selected` per identity.
- **Waitlist join rate** = joiners ÷ unique pro-page viewers.

Dashboard: `/admin/validation` (server-side `OWNER_EMAILS` allowlist; 404 for
everyone else). Small-sample warning below 30 users.

## Validation thresholds (directional, not guarantees)

Minimum sample before conclusions: ≥300 unique visitors, ≥100 completed first
readings, ≥30 users with 3+ readings, ≥30 users old enough for D7.

Usage signals: first-reading completion ≥60%; D7 (registered) ≥15% promising,
≥20% strong, <8% weak; ≥30 users with 3+ readings; ≥10% of engaged users save
a journal entry.

Willingness-to-pay signals: ≥5% of pro-page viewers join the waitlist (≥10%
strong); ≥10 total signups; ≥3 interview volunteers; a clear price preference;
stronger when Pro interest comes from 3+-reading users. **Waitlist signups do
not prove willingness to pay** — that requires the founding-member presale.

Change strategy if: retention is fine but waitlist <2% (lean toward one-time
digital products); or waitlist is strong but D7 <8% (fix the ritual loop before
charging anyone).

## 30-day experiment checklist

- [ ] Set `OWNER_EMAILS`, run `npm run db:migrate` (db push) + `db:seed`, deploy
- [ ] Week 1: verify events arrive; watch first-reading completion + surfaces
- [ ] Week 1–2: start build-in-public posts; drive first ~100 visitors
- [ ] Week 2: check D1; confirm pro-page views + plan selections are recording
- [ ] Week 3: first D7 cohorts readable; review waitlist size + plan preferences
- [ ] Week 3–4: contact interview volunteers (target 5–10 conversations)
- [ ] Day 30: write up findings against thresholds; decide: presale / adjust / hold

## Founding-member presale plan (NOT launched — future experiment)

- **Invite**: waitlist members + users with ≥3 readings, personally, in order of
  engagement. No public advertising until separately approved.
- **Offer**: $59 founding lifetime access to Pro, limited to 100 seats.
  Features promised carefully: only unlimited project readings, saved projects,
  full journal history, patterns, export — each labeled with expected timing;
  no dates promised for anything not yet designed.
- **Payment**: a single Stripe/Lemon Squeezy payment link; no billing system.
- **Entitlement**: manual — a `foundingMember` flag set by the owner on the
  account after purchase; honored forever.
- **Refunds**: 14-day no-questions; refund immediately restores nothing to
  revoke since free tier stays intact.
- **Green light to build the full paid tier**: ≥10 real founding purchases.
- **Redirect signal**: strong engagement but <5 purchases → pivot toward
  one-time digital products (printable deck, reading packs) and/or a physical
  deck interest list instead of subscriptions.
- Never: fake purchases, production test charges, artificial scarcity.

## Privacy commitments (see /privacy)

Events: no raw context, no reading/synthesis text, no notes, no emails-in-props,
no IP/location/fingerprinting; 180-day retention. Journal snapshots store the
rendered reading + extracted subject phrase — never the raw context paragraph.
Waitlist stores email + plan preference + opt-ins only; no email provider is
configured, so unsubscribe/removal is handled manually via the owner export.
