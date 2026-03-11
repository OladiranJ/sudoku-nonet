# Nonet — Product Requirements Document

> **Nonet** *(noun)*: a composition or group of nine. A Sudoku web application.

---

## Overview

A browser-based Sudoku game with user accounts, social features, and a global leaderboard. Built with Next.js, TypeScript, and Supabase. Invite-only at launch — guests can play freely but must be invited to create an account and save stats.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | First-class Vercel support, SSR/SSG, file-based routing |
| Frontend state | Zustand | Lightweight, TypeScript-friendly, no boilerplate |
| API layer | tRPC | End-to-end type safety, no REST boilerplate, native Next.js integration |
| Database | Supabase (Postgres) | Free tier, built-in auth, Row Level Security, realtime |
| Auth | Supabase Auth | Supports email/password, Google OAuth, Apple OAuth out of the box |
| Hosting | Vercel | First-class Next.js, serverless functions, global CDN, free tier |
| OG Images | Vercel OG (satori) | Server-rendered result card images for social sharing |
| Rate limiting | Upstash Redis (free tier) | Lightweight serverless rate limiting for API endpoints |

---

## Platform & Targets

- **Truly equal** — desktop and mobile are both first-class experiences
- Desktop: side-by-side layout (board left, controls + numpad right), mouse + keyboard
- Mobile: stacked layout (board top, numpad bottom), touch-first
- Physical/accessory keyboards supported on both (e.g. iPad Magic Keyboard)

---

## Visual Design

- **Style**: Clean & minimal — white/light background, thin borders, intentional whitespace
- **Dark mode**: Manual toggle (button in UI); preference persisted in `localStorage`
- **Typography**: Display/serif font for the "Nonet" wordmark; clean sans-serif for board and UI
- **Colors**: Custom brand palette — not default Tailwind colors
- **Animations**: `transform` and `opacity` only. Spring-style easing. No `transition-all`
- **Interactive states**: Hover, focus-visible, and active states on every clickable element
- **WCAG AA** color contrast minimum

---

## Layout

### Desktop
```
+--------------------------------------------+
|  Nonet              [Stats] [🔔] [🌙] [👤] |
+----------------------+---------------------+
|                      |  Difficulty: Hard   |
|     9×9 Board        |  Timer: 04:32  [||] |
|                      |  Errors: 2          |
|                      |                     |
|                      |  [ 1 ][ 2 ][ 3 ]   |
|                      |  [ 4 ][ 5 ][ 6 ]   |
|                      |  [ 7 ][ 8 ][ 9 ]   |
|                      |  [✏ Notes][ ⌫ ]   |
|                      |                     |
|                      |  [Hint][Undo][Redo] |
|                      |  [New Game]         |
+----------------------+---------------------+
```

### Mobile
```
+-----------------------------+
|  Nonet    [🔔][🌙][👤]    |
|  Hard | 04:32 [||] | ✗ 2  |
+-----------------------------+
|         9×9 Board           |
+-----------------------------+
|  [1][2][3][4][5][6][7][8][9]|
|  [✏ Notes]         [ ⌫ ] |
|  [Hint]  [↩ Undo] [↪ Redo] |
|         [New Game]          |
+-----------------------------+
```

---

## Access & Authentication

### Invite-Only Sign-Up
- Public sign-up is **disabled** in Supabase Auth settings
- Guests can play freely — no account required
- To create an account, a user must have a valid invite link
- Sign-up flow: enter invite link → choose auth method → pick username → account created

### Supported Auth Methods
- Email + password (with email verification)
- Google OAuth ("Sign in with Google")
- Apple OAuth ("Sign in with Apple")

### Guest Experience
- Full game play with all puzzle features
- Stats stored in `localStorage` only — not synced across devices
- After completing a puzzle, guests are prompted: "Save your stats — create a free account"
- Guest stats are **not** migrated to account on sign-up (v1 scope)

---

## Invite System

### How It Works
1. Admin generates an invite link from the `/admin` panel
2. Link format: `nonet.app/invite/[unique-code]`
3. Admin copies and shares the link however they choose (text, DM, email, etc.)
4. Recipient clicks the link and is taken to the sign-up page with the code pre-filled
5. Code is validated server-side; if valid, sign-up proceeds
6. Code is immediately marked as used and cannot be reused

### Invite Rules
- **Single-use**: each code works for exactly one sign-up
- **24-hour expiry**: codes expire 24 hours after generation
- **Admin-only generation**: only the admin account can create invite codes (v1)
- Future toggle: grant invited users a limited number of their own invite codes

### Invite Database Schema
```sql
invites (
  id          uuid primary key,
  code        text unique not null,        -- random slug, e.g. "x7k2-mn9p"
  created_by  uuid references profiles,   -- admin user
  used_by     uuid references profiles,   -- null until redeemed
  used_at     timestamptz,
  expires_at  timestamptz not null,        -- created_at + 24h
  created_at  timestamptz default now()
)
```

---

## Database Schema

```sql
-- User profiles (extends Supabase auth.users)
profiles (
  id            uuid primary key references auth.users,
  username      text unique not null,       -- chosen at sign-up, public
  display_name  text,
  avatar_url    text,
  is_admin      boolean default false,
  created_at    timestamptz default now()
)

-- Completed games
games (
  id            uuid primary key,
  user_id       uuid references profiles,   -- null for guests (not saved)
  puzzle_seed   text not null,              -- reproducible seed string
  difficulty    text not null,              -- easy | medium | hard | expert
  time_seconds  integer not null,
  error_count   integer not null default 0,
  hint_count    integer not null default 0,
  is_daily      boolean not null default false,  -- true if this was a daily puzzle attempt
  puzzle_date   date,                            -- date of the daily puzzle (null for random)
  completed_at  timestamptz default now()
)

-- Social graph
follows (
  follower_id   uuid references profiles,
  following_id  uuid references profiles,
  created_at    timestamptz default now(),
  primary key (follower_id, following_id)
)

-- Puzzle challenges
challenges (
  id                uuid primary key,
  challenger_id     uuid references profiles,
  challenged_id     uuid references profiles,
  puzzle_seed       text not null,
  difficulty        text not null,
  status            text default 'pending',  -- pending | accepted | completed
  challenger_time   integer,                 -- seconds, null until solved
  challenged_time   integer,                 -- seconds, null until solved
  created_at        timestamptz default now(),
  completed_at      timestamptz
)

-- Achievements
achievements (
  id          uuid primary key,
  user_id     uuid references profiles,
  badge_id    text not null,               -- e.g. "first_solve", "sub_2_min_expert"
  earned_at   timestamptz default now(),
  unique (user_id, badge_id)
)

-- In-app notifications
notifications (
  id          uuid primary key,
  user_id     uuid references profiles,
  type        text not null,              -- challenge_received | challenge_result | achievement | follow
  payload     jsonb,
  read        boolean default false,
  created_at  timestamptz default now()
)

-- Invite codes (see above)
invites ( ... )
```

### Row Level Security (RLS)
- All tables have RLS enabled
- `profiles`: public read, own-write only
- `games`: public read, insert own only
- `follows`: public read, own-write only
- `challenges`: read if challenger or challenged, insert own only
- `achievements`: public read, insert via server only (not client-writable)
- `notifications`: own read/write only
- `invites`: admin-only write, server-side read for validation

---

## Features

### 1. Puzzle Generation
- Generated **client-side** from a seeded random number generator
- Seed is a string stored in the `games` table alongside the result
  - **Random puzzles**: seed is a short random string generated at game start
  - **Daily puzzles**: seed is derived deterministically from date + difficulty (e.g. a hash of `"YYYY-MM-DD-hard"`); no storage needed — the same seed is computed identically by every client
- Same seed always produces the same puzzle (enables challenges and daily consistency)
- Four difficulty levels (revealed clue counts):
  - Easy: ~45 clues | Medium: ~35 | Hard: ~27 | Expert: ~22
- Every puzzle has a **unique solution** (uniqueness verified during generation)

### 2. New Game Flow
- "New Game" button opens a **two-step modal**:
  1. **Step 1 — Difficulty**: choose Easy | Medium | Hard | Expert
  2. **Step 2 — Puzzle Type**: choose Daily Puzzle | Random Puzzle
- On confirm, the appropriate puzzle is loaded and the game begins
- In-progress game is auto-saved before starting a new one

### 2b. Daily Puzzle
- One unique puzzle per difficulty per day (4 daily puzzles total at any given time)
- Seed is derived **deterministically** from date + difficulty (e.g. a hash of `"YYYY-MM-DD-hard"`) — no admin action or DB entry required; every client generates the same puzzle automatically
- Each logged-in user gets **exactly one attempt per day per difficulty** — after completing the daily puzzle it is locked until midnight; the UI shows their completion time and a countdown to the next puzzle
- Guests may play the daily puzzle freely but their result is not submitted to the leaderboard
- Daily puzzle seed is stable: same date + difficulty always produces the same puzzle for every player worldwide

### 3. Game Board
- 9×9 grid; bold borders separate nine 3×3 sub-grids
- **Clue cells**: bold, distinct style, non-editable
- **Player cells**: editable, styled differently
- **Selected cell**: highlighted with accent color
- **Peer highlight**: row, column, and 3×3 box of selected cell lightly shaded
- **Same-number highlight**: all matching digits softly highlighted
- **Conflict highlight**: duplicates in row/column/box highlighted red (real-time)

### 4. Input
- **On-screen numpad**: 3×3 digit grid (1–9) + Erase button + Notes toggle
- **Physical keyboard**: 1–9 keys, Backspace/Delete to erase, arrow keys to navigate
- Numpad buttons **gray out** when all 9 of that digit are placed
- Erase button on numpad + Backspace/Delete keyboard support

### 5. Notes / Pencil Mode
- Toggle between Pen and Pencil modes
- Pencil mode: up to 9 small candidate numbers per cell
- Notes auto-cleared when a cell's final answer is filled in
- Notes preserved on undo

### 6. Error Tracking
- Real-time conflict detection — duplicates highlighted red immediately
- **Error counter** displayed persistently in the UI
- Undoing a move does **not** decrement the error count
- Error count saved to `games` table on completion

### 7. Hints
- Hint button highlights a cell that is **logically solvable next** — does not reveal the answer
- Unlimited hints; count tracked and shown in the completion modal and profile stats

### 8. Timer
- Elapsed time shown as MM:SS; visible by default, user can toggle off
- **Pause**: overlays board with a blur cover, blocking play until "Resume" is clicked
- Pauses automatically when tab loses focus
- Stops on puzzle completion
- Timer state persisted in Zustand + `localStorage`

### 9. Undo / Redo
- Full undo/redo history stack (Ctrl+Z / Ctrl+Y + UI buttons)
- Undoing does not reduce error count
- Stack resets on new game

### 10. Auto-Save & Resume
- Game state saved to `localStorage` on every move (board, notes, timer, errors, undo stack)
- Silent restore on page reload — no prompt, just continues
- Logged-in users: current in-progress game keyed to their user ID

### 11. Completion Flow
1. Puzzle detected as complete (all cells correctly filled)
2. Confetti animation fires
3. Completion modal shows: time, difficulty, errors, hints used
4. Result is saved to the `games` table (if logged in)
5. Achievement checks run client-side; confirmed and saved via tRPC mutation
6. Modal options: "Play Again" (same difficulty), "New Game" (difficulty modal), "Share"

### 12. Result Card Sharing
- "Share" button generates a unique result URL: `nonet.app/result/[game-id]`
- The result page has a rich **Open Graph image** auto-generated via Vercel OG (satori):
  - Nonet logo, difficulty, solve time, error count, username
  - Styled to match the app's clean aesthetic
- User can copy the link or use native share sheet (Web Share API on mobile)

---

## Social Features

### Public Profile (`/u/[username]`)
Visible to anyone (no login required). Shows:
- Username and avatar
- Stats per difficulty: puzzles solved, best time, average time
- Recent activity (last 10 completions with time and difficulty)
- Follower / following counts
- Earned achievements / badges

### Follow System
- Follow / unfollow any user
- Follower and following counts shown on profiles
- In-app notification when someone follows you

### Friend Feed
- Logged-in users see a feed of recent completions from people they follow
- Each feed item: username, difficulty, time, difficulty badge, timestamp
- Feed accessible from the main nav

### Challenges
- After completing a **random puzzle**, option to "Challenge a friend" using that puzzle's seed
- Challenge creates a record in the `challenges` table with the seed and your time
- Challenged user receives an in-app notification
- They play the identical puzzle (same seed); result compared on a shared challenge page
- Challenge page shows: both names, times, winner highlighted
- Challenge results appear **only on the challenge page** — not on any leaderboard
- Daily puzzles cannot be used to issue challenges (everyone already plays the same daily puzzle)

---

## Leaderboard

- Accessible from the main nav
- Based on **daily puzzle results only** — all ranked players solved the identical puzzle, making times directly comparable
- Ranked by **best solve time** per difficulty
- Views:
  - **All-time**: fastest daily solves ever recorded (one entry per user per difficulty — their personal best)
  - **This week**: fastest daily solves in the current 7-day window
- **Friends filter**: toggle to show only users you follow
- Each row: rank, username, best time, daily puzzles solved
- Random puzzle results do **not** appear on the leaderboard

---

## Achievements / Badges

Awards granted client-side on detect, confirmed and persisted server-side via tRPC:

| Badge | Criteria |
|---|---|
| First Solve | Complete your first puzzle |
| Speed Demon | Solve Easy in under 3 min |
| Expert Mind | Solve Expert in under 10 min |
| Clean Sheet | Complete a puzzle with 0 errors |
| Hint-Free | Complete a puzzle with 0 hints |
| Social Butterfly | Follow 5 or more players |
| Challenger | Issue your first challenge |

---

## Notifications (In-App Only)

- Bell icon in header; badge count shown when unread notifications exist
- Notification types:
  - Someone followed you
  - Challenge received
  - Challenge result (win/lose)
  - Achievement earned
- Notifications stored in the `notifications` table; marked read on view

---

## Admin Panel (`/admin`)

Protected route — accessible only to accounts with `is_admin = true`. Features:
- **Invite management**: generate new invite links (with copy button), view pending and used invites, revoke unused codes
- **User list**: view all registered users, join date, game count
- Supabase dashboard used for everything else (raw table editing, auth management, SQL queries)

---

## Security

- **Row Level Security** on all Supabase tables (see schema above)
- **Rate limiting** on sensitive tRPC endpoints (auth, invite validation, game submission) via Upstash Redis
- **Invite validation** is server-side only — client cannot bypass code checks
- **Puzzle validation**: trust client-reported results for now (casual friends game). Architecture supports adding server-side validation later by replaying the solve server-side using the stored seed
- Supabase Auth handles token rotation, session management, and OAuth securely

---

## Stats (Per-User, Stored in DB)

Aggregated from the `games` table per user per difficulty (both daily and random puzzles):
- Puzzles solved (total)
- Best time
- Average time

Displayed on profile pages and the stats modal in-app. Leaderboard rankings use **daily puzzle results only**.

---

## Audio

- Subtle, toggleable sound effects (preference saved to `localStorage`)
- Soft click on cell selection
- Gentle chime on puzzle completion
- Off by default; user can enable in settings

---

## Out of Scope (v1)

- Open public registration (invite-only at launch)
- Real-time head-to-head multiplayer
- Push notifications or email notifications
- Server-side puzzle solution validation (can add later)
- Guest stat migration to account on sign-up
- Win streak tracking
- Puzzle import/export
- Multiple themes beyond light/dark

---

## Project Structure (Next.js App Router)

```
/app
  /                        → Home (game board)
  /invite/[code]           → Invite landing + sign-up
  /u/[username]            → Public profile
  /leaderboard             → Global leaderboard
  /result/[gameId]         → Shareable result page
  /admin                   → Admin panel (protected)
  /api/trpc/[trpc]         → tRPC handler

/components
  /board                   → Sudoku grid, cells
  /numpad                  → Number input pad
  /modals                  → New game, completion, challenge
  /social                  → Feed, follow button, notifications

/server
  /trpc                    → tRPC router + procedures
  /db                      → Supabase client + queries

/lib
  /sudoku                  → Puzzle generation, solver, seed logic
  /store                   → Zustand stores (game state, UI state)
  /utils                   → Helpers
```

---

## Success Criteria

- Every generated puzzle has a unique solution
- Invite system correctly blocks unauthorized sign-ups
- Game results saved to Supabase for logged-in users on every completion
- Stats aggregate correctly across sessions and devices
- Leaderboard reflects accurate best times per difficulty
- Challenge system creates a reproducible identical puzzle for both players
- Result card OG image renders correctly when link is shared on social media
- No UI bugs on Chrome (desktop), Safari (mobile), Firefox
- RLS prevents any user from reading or writing another user's private data
