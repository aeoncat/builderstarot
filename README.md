# Builder's Tarot MVP

Builder's Tarot is a Next.js 14 MVP with custom suits/court cards, deterministic daily draws, spreads, and journaling in both logged-in and guest mode.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (credentials login)
- Zod validation
- Framer Motion (card reveal animations)

## Features

- Home with core CTAs, daily preview, and recent draws (for logged-in users)
- Card Library with search + filters (arcana, suit, rank)
- Card detail with meanings, prompt questions, and favorites toggle
- Single draw flow with reversed chance toggle and journal save
- Deterministic Daily Card
  - Logged-in users: one per day in DB (`America/Chicago` date key)
  - Guests: one per day in localStorage (browser local date)
- Spreads
  - 1-Card
  - 3-Card (Past / Present / Future)
  - 5-Card (Problem / Cause / Advice / Outcome / Lesson)
- Journal list/detail, edit notes, delete with confirm modal
- Settings page (theme toggle in navbar + default reversed chance)

## Project Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Push schema and seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Start dev server:

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Demo Login

- Email: `demo@builderstarot.local`
- Password: `builder123`

Guest mode works without login and stores data in localStorage.

## Database Models

- `User`, `Account`, `Session`, `VerificationToken`
- `Card`
- `Favorite`
- `DailyDraw`
- `SpreadSession`, `SpreadCard`
- `JournalEntry`, `JournalEntryCard`

## API Routes

- `GET /api/cards`
- `GET /api/cards/:id`
- `POST /api/draw`
- `POST /api/journal`
- `GET /api/journal`
- `GET /api/journal/:id`
- `PATCH /api/journal/:id`
- `DELETE /api/journal/:id`
- `POST /api/favorites/:cardId`
- `GET /api/daily`

## Notes

- Seed includes 34 cards:
  - 10 Major Arcana (including **The Dropout**)
  - 20 Minor Arcana (5 per suit)
  - 4 Court cards (Novice/Apprentice/Expert/Lead)
- Favorites/journal/daily persist to DB when logged in and localStorage in guest mode.
