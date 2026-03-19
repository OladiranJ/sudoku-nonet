# Nonet — Progress Tracker

> Source of truth for what has been built. See `CLAUDE.md` for workflow rules.
> Do not mark a task `[x]` without passing tests and a commit hash.

---

## Phase 0: Project Scaffolding

### 0.1 — Initialize Next.js + TypeScript project
- [x] Create Next.js app with App Router, TypeScript, Tailwind CSS
- [x] Install core dependencies: Zustand, tRPC, Supabase client
- [x] Configure `tsconfig.json` path aliases (`@/`)
- [x] Set up project folder structure per PRD (`/app`, `/components`, `/server`, `/lib`)
- [x] **Tests:**
  - `npm run build` completes without errors
  - `npm run dev` starts without errors
- **Commit:** `a760851`

### 0.2 — Testing infrastructure
- [x] Install and configure Jest + ts-jest for unit/integration tests
- [x] Install and configure Playwright for E2E tests
- [x] Add `npm test`, `npm run test:coverage`, and Playwright scripts to `package.json`
- [x] Create a trivial smoke test to verify the pipeline works
- [x] **Tests:**
  - `smoke.test.ts` — dummy assertion passes via `npm test`
  - `npx playwright test` runs without config errors
- **Commit:** `4f4ba68`

### 0.3 — Dev tooling & utilities
- [x] Set up `serve.mjs` (wraps `next dev` at localhost:3000 with port-in-use check)
- [x] Set up `screenshot.mjs` + Puppeteer for visual testing
- [x] Verify screenshot workflow: start server → screenshot → read PNG
- [x] **Tests:**
  - Dev server starts and responds on `http://localhost:3000`
  - Screenshot saves to `./temporary screenshots/`
- **Commit:** `09d1231`

---

## Phase 1: Puzzle Engine (Pure Logic)

### 1.1 — Seeded random number generator
- [x] Implement a deterministic PRNG that accepts a string seed
- [x] Same seed always produces the same sequence of numbers
- [x] **Tests (`lib/sudoku/prng.test.ts`):**
  - Same seed → identical output sequence (run twice, compare)
  - Different seeds → different output sequences
  - Output is deterministic across 1000+ calls
- **Commit:** `4364b0a`

### 1.2 — Sudoku board generator
- [x] Generate a valid, fully-filled 9×9 Sudoku board from a seed
- [x] Every row, column, and 3×3 box contains digits 1–9 exactly once
- [x] **Tests (`lib/sudoku/generator.test.ts`):**
  - Generated board passes full validity check (rows, cols, boxes)
  - Same seed → identical board
  - Different seeds → different boards (test 10 seeds)
- **Commit:** `54439e8`

### 1.3 — Puzzle creator (clue removal)
- [x] Remove digits from a filled board to create a puzzle with a unique solution
- [x] Difficulty controls clue count: Easy ~45, Medium ~35, Hard ~27, Expert ~22
- [x] Uniqueness verified via backtracking solver during generation
- [x] **Tests (`lib/sudoku/puzzle.test.ts`):**
  - Each difficulty produces clue count within ±3 of target
  - Every generated puzzle has exactly one solution (test 5 puzzles per difficulty)
  - Same seed + difficulty → identical puzzle
- **Commit:** `7e97821`

### 1.4 — Sudoku solver
- [x] Backtracking solver that finds all solutions (up to a limit of 2, for uniqueness check)
- [x] Can solve any valid puzzle
- [x] **Tests (`lib/sudoku/solver.test.ts`):**
  - Solves a known Easy puzzle correctly
  - Solves a known Expert puzzle correctly
  - Returns 1 solution for a unique puzzle
  - Returns 2 solutions for an ambiguous puzzle (crafted test case)
  - Returns 0 solutions for an invalid puzzle
- **Commit:** `e556612`

### 1.5 — Daily puzzle seed derivation
- [x] Function: `getDailySeed(date: string, difficulty: string) → string`
- [x] Deterministic hash of `"YYYY-MM-DD-difficulty"`
- [x] **Tests (`lib/sudoku/daily.test.ts`):**
  - Same date + difficulty → same seed
  - Different dates → different seeds
  - Different difficulties on same date → different seeds
  - Seed produces a valid, unique-solution puzzle
- **Commit:** `e99da8c`

---

## Phase 2: Game Board UI

### 2.1 — 9×9 grid component
- [x] Render a 9×9 grid with bold 3×3 sub-grid borders
- [x] Clue cells styled bold and non-editable; player cells styled differently
- [x] Responsive: fills available width, maintains square aspect ratio
- [x] **Tests (`components/board/Board.test.tsx`):**
  - Renders 81 cells
  - Clue cells have `data-clue="true"` attribute and are non-editable
  - Player cells have `data-clue="false"` and are editable
  - 3×3 borders are visually distinct (check CSS classes)
- **Commit:** `b83ce93`

### 2.2 — Cell selection & highlighting
- [x] Click/tap a cell to select it (accent color highlight)
- [x] Peer highlight: row, column, and 3×3 box of selected cell shaded
- [x] Same-number highlight: all cells with the same digit softly highlighted
- [x] **Tests (`components/board/Board.test.tsx`):**
  - Clicking a cell sets it as selected (check `aria-selected` or class)
  - Peer cells (same row/col/box) get highlight class
  - Cells with matching digit get same-number highlight class
  - Selecting an empty cell does not trigger same-number highlight
- **Commit:** `4762bdc`

### 2.3 — Conflict highlighting
- [x] Duplicates in row, column, or box highlighted red in real-time
- [x] Conflicts update immediately on input
- [x] **Tests (`components/board/Board.test.tsx`):**
  - Entering a duplicate digit in a row marks both cells as conflicting
  - Entering a duplicate in a column marks both cells as conflicting
  - Entering a duplicate in a box marks both cells as conflicting
  - Removing the duplicate clears the conflict highlight
- **Commit:** `e39bd52`

---

## Phase 3: Input & Controls

### 3.1 — On-screen numpad
- [x] 3×3 grid of digit buttons (1–9) + Erase button
- [x] Tapping a digit fills the selected cell
- [x] Erase button clears the selected cell
- [x] Digits gray out when all 9 instances are placed on the board
- [x] **Tests (`components/numpad/Numpad.test.tsx`):**
  - Renders 9 digit buttons and an erase button
  - Clicking a digit dispatches correct action to game store
  - Clicking erase dispatches erase action
  - Button for digit with 9 placements has disabled/grayed-out state
- **Commit:** `ca6eee2`

### 3.2 — Keyboard input
- [x] 1–9 keys fill the selected cell
- [x] Backspace/Delete erases the selected cell
- [x] Arrow keys navigate cell selection
- [x] **Tests (`components/board/KeyboardInput.test.tsx`):**
  - Pressing "5" fills selected cell with 5
  - Pressing Backspace clears selected cell
  - Arrow keys move selection in correct direction
  - Arrow keys clamp at board edges (stop, no wrap)
  - Keyboard input on a clue cell is ignored
- **Commit:** `cf2153a`

### 3.3 — Notes / Pencil mode
- [x] Toggle button switches between Pen and Pencil mode
- [x] Pencil mode: digits appear as small candidates in the cell (up to 9)
- [x] Toggling a note on/off for the same digit
- [x] Notes auto-clear when a final answer is placed in that cell
- [x] **Tests (`components/board/Notes.test.tsx`):**
  - Toggling pencil mode changes store state
  - In pencil mode, entering a digit adds it as a note (not a final value)
  - Entering the same digit again removes the note
  - Placing a final value clears all notes in that cell
  - Notes are preserved on undo (tested in Phase 4)
- **Commit:** `c29252a`

---

## Phase 4: Game State & Logic

### 4.1 — Zustand game store
- [x] Store holds: board state, solution, notes, selected cell, difficulty, seed, isDaily, puzzleDate
- [x] Actions: `selectCell`, `placeDigit`, `erase`, `toggleNotes`
- [x] Derive: conflicts, digit counts, isComplete
- [x] **Tests (`lib/store/gameStore.test.ts`):**
  - `placeDigit` updates the cell value
  - `erase` clears the cell value
  - `selectCell` updates the selected cell
  - `toggleNotes` switches mode
  - Placing a digit on a clue cell is a no-op
  - `isComplete` returns true only when all cells match the solution
- **Commit:** `9eed7ed`

### 4.2 — Error tracking
- [x] Error counter increments when a digit conflicts with the solution
- [x] Counter displayed in UI
- [x] Undo does **not** decrement error count
- [x] **Tests (`lib/store/gameStore.test.ts`):**
  - Placing an incorrect digit increments `errorCount`
  - Placing a correct digit does not increment `errorCount`
  - Undoing an incorrect digit does not decrement `errorCount`
  - Error count persists across undo/redo
- **Commit:** `1e26b70`

### 4.3 — Timer
- [x] Elapsed time as MM:SS, visible by default
- [x] Pause: overlay with blur, blocks play, shows "Resume"
- [x] Auto-pause on tab blur (`visibilitychange` event)
- [x] Stops on puzzle completion
- [x] **Tests (`lib/store/timerStore.test.ts`):**
  - Timer starts at 0 on new game
  - `pause()` stops the timer
  - `resume()` resumes the timer
  - Timer value persists through pause/resume cycle
  - `stop()` halts the timer permanently (completion)
- **Commit:** `3d954de`

### 4.4 — Undo / Redo
- [x] Full history stack: every `placeDigit` and `erase` is recorded
- [x] Ctrl+Z / Ctrl+Y and UI buttons
- [x] Notes preserved on undo
- [x] Stack resets on new game
- [x] **Tests (`lib/store/gameStore.test.ts`):**
  - After placing a digit, undo restores previous state
  - After undo, redo restores the digit
  - Undo past the beginning is a no-op
  - Redo past the end is a no-op
  - Notes are correctly restored on undo
  - Starting a new game clears the undo stack
- **Commit:** `1b2deb8`

### 4.5 — Auto-save & resume
- [x] Game state serialized to `localStorage` on every move
- [x] On page load, game state restored silently from `localStorage`
- [x] Logged-in users: state keyed to user ID
- [x] **Tests (`lib/store/autoSave.test.ts`):**
  - After a move, `localStorage` contains serialized game state
  - On init with existing `localStorage` data, store hydrates correctly
  - Board, notes, timer, error count, and undo stack all restored
  - Different user IDs use different storage keys
- **Commit:** `54f65d2`

---

## Phase 5: New Game Flow

### 5.1 — New game modal (two-step)
- [x] "New Game" button opens modal
- [x] Step 1: select difficulty (Easy / Medium / Hard / Expert)
- [x] Step 2: select puzzle type (Daily Puzzle / Random Puzzle)
- [x] On confirm: generates puzzle and starts game
- [x] In-progress game auto-saved before starting new one
- [x] **Tests (`components/modals/NewGameModal.test.tsx`):**
  - Modal opens when "New Game" is clicked
  - All 4 difficulty options are rendered
  - After selecting difficulty, puzzle type step appears
  - Selecting "Random Puzzle" generates a random seed and starts the game
  - Selecting "Daily Puzzle" generates a date-based seed and starts the game
  - Modal closes after confirmation
- **Commit:** `74486a6`

### 5.2 — Daily puzzle lockout
- [x] After completing a daily puzzle, that difficulty is locked for the rest of the day
- [x] UI shows completion time and countdown to next daily puzzle
- [x] "Daily Puzzle" button disabled/shows status for completed difficulties
- [x] **Tests (`components/modals/NewGameModal.test.tsx` or `lib/store/dailyStore.test.ts`):**
  - After completing a daily puzzle, `isDailyCompleted(difficulty, date)` returns true
  - Completed daily difficulty shows as locked in the modal
  - Lockout resets when the date changes
  - Guest daily completions are tracked in localStorage
- **Commit:** `2206ecc`

---

## Phase 6: Completion Flow

### 6.1 — Completion detection & modal
- [x] Detect when all cells correctly filled → trigger completion
- [x] Confetti animation fires
- [x] Modal shows: time, difficulty, errors, hints, daily/random badge
- [x] Options: "Play Again", "New Game", "Share"
- [x] **Tests (`components/modals/CompletionModal.test.tsx`):**
  - Modal appears when `isComplete` becomes true
  - Modal displays correct time, difficulty, error count, hint count
  - "Play Again" starts same difficulty
  - "New Game" opens the new game modal
  - Daily completions show "Daily" badge; random show "Random"
- **Commit:** `e772f59`

### 6.2 — Hints system
- [x] Hint button highlights a logically solvable cell (does not reveal answer)
- [x] Hint count tracked and incremented per use
- [x] Hint count shown in completion modal
- [x] **Tests (`lib/sudoku/hints.test.ts`):**
  - Hint returns a valid cell coordinate that is logically deducible
  - Hint count increments on each use
  - Hint does not reveal the cell's answer (only highlights)
  - Hint returns null when no logically solvable cells remain (all remaining require guessing)
- **Commit:** `8dbf256`

---

## Phase 7: Theming & Layout

### 7.1 — Responsive layout (desktop & mobile)
- [x] Desktop: side-by-side (board left, controls right)
- [x] Mobile: stacked (board top, controls bottom)
- [x] Header: Nonet wordmark, nav icons
- [x] **Tests (`app/page.test.tsx` or E2E):**
  - Desktop viewport: board and controls side-by-side (check layout)
  - Mobile viewport: board above controls (check layout)
  - Header renders with wordmark and icon buttons
- **Commit:** `25213cf`

### 7.2 — Dark mode
- [x] Toggle button in header
- [x] Preference persisted in `localStorage`
- [x] All components respect dark mode (board, numpad, modals, header)
- [x] **Tests (`lib/store/themeStore.test.ts`):**
  - Toggle switches `dark` class on `<html>`
  - Preference saved to `localStorage`
  - On load, preference restored from `localStorage`
  - Default is light mode
- **Commit:** `69ec4b1`

### 7.3 — Brand identity & visual polish
- [x] Custom color palette (not default Tailwind)
- [x] Display/serif font for "Nonet" wordmark; sans-serif for UI
- [x] Layered shadows, intentional spacing, depth system
- [x] Interactive states on all clickable elements (hover, focus-visible, active)
- [x] WCAG AA contrast on all text
- [x] **Tests (visual / manual + screenshot comparison):**
  - Screenshot matches design intent (2 rounds of comparison)
  - No default Tailwind blue/indigo used as primary color
  - All buttons have distinct hover and focus-visible states (E2E or manual check)
- **Commit:** `b1f9e00`

---

## Phase 8: Database & API

### 8.1 — Supabase schema & RLS
- [x] Create all tables: `profiles`, `games`, `follows`, `challenges`, `achievements`, `notifications`, `invites`
- [x] Enable RLS on all tables with policies per PRD
- [x] `games` table includes `is_daily` and `puzzle_date` columns
- [x] **Tests (`server/db/schema.test.ts` or migration verification):**
  - All tables exist with correct columns and types
  - RLS policies: user can read own profile, cannot write another user's profile
  - RLS policies: user can insert own game, cannot insert for another user
  - RLS policies: notifications only readable by own user
- **Commit:** `2a60968`

### 8.2 — Supabase client setup
- [x] Server-side and client-side Supabase clients configured
- [x] Environment variables for Supabase URL and anon key
- [x] **Tests (`server/db/client.test.ts`):**
  - Client initializes without error
  - Client can reach Supabase (health check or simple query)
- **Commit:** `99e5848`

### 8.3 — tRPC router setup
- [x] Initialize tRPC with Next.js App Router
- [x] Create base router with context (auth session)
- [x] Wire up `/api/trpc/[trpc]` handler
- [x] **Tests (`server/trpc/router.test.ts`):**
  - tRPC handler responds to a health-check procedure
  - Context includes session (null for unauthenticated)
- **Commit:** `2a12e8f`

### 8.4 — Game submission endpoint
- [x] tRPC mutation: `submitGame` — saves completed game to `games` table
- [x] Validates required fields: seed, difficulty, time, errors, hints, is_daily, puzzle_date
- [x] Daily puzzle: rejects if user already has a submission for that date + difficulty
- [x] **Tests (`server/trpc/game.test.ts`):**
  - Valid submission creates a row in `games`
  - Missing fields rejected with validation error
  - Duplicate daily submission for same user + date + difficulty is rejected
  - Random puzzle submissions are always accepted
- **Commit:** `1bacff8`

---

## Phase 9: Auth & Invites

### 9.1 — Supabase Auth integration
- [x] Email + password sign-up/login
- [x] Google OAuth
- [x] Apple OAuth
- [x] Session management (token rotation handled by Supabase)
- [x] Public sign-up disabled (invite-only)
- [x] **Tests (`server/auth/auth.test.ts`):**
  - Sign-up without invite code is rejected
  - Sign-up with valid invite code succeeds
  - Login with valid credentials returns a session
  - Login with invalid credentials is rejected
- **Commit:** `165146e`

### 9.2 — Invite system
- [x] Admin generates invite codes from `/admin`
- [x] Codes are single-use, expire after 24 hours
- [x] Sign-up flow: invite code → auth method → username → account
- [x] **Tests (`server/trpc/invite.test.ts`):**
  - Admin can generate an invite code
  - Non-admin cannot generate an invite code
  - Valid code can be redeemed exactly once
  - Expired code (>24h) is rejected
  - Already-used code is rejected
  - After redemption, `used_by` and `used_at` are populated
- **Commit:** `b8cfb4c`

### 9.3 — Invite landing page (`/invite/[code]`)
- [x] Renders sign-up form with code pre-filled
- [x] Validates code on page load (shows error if invalid/expired)
- [x] Auth method selection: email, Google, Apple
- [x] Username picker after auth
- [x] **Tests (`app/invite/InvitePage.test.tsx`):**
  - Page renders with invite code from URL
  - Invalid code shows error message
  - Valid code shows auth method selection
  - After auth, username input appears
  - Submitting username creates profile
- **Commit:** `eca66cb`

### 9.4 — Guest experience
- [x] Guests can play all puzzle features without an account
- [x] Stats stored in `localStorage` only
- [x] Post-completion prompt: "Save your stats — create a free account"
- [x] Guest daily results not submitted to leaderboard
- [x] **Tests (`lib/store/guestStore.test.ts`):**
  - Guest game state saves to `localStorage`
  - Guest stats (solved count, best time) accumulate in `localStorage`
  - Completion modal shows account prompt for guests
  - No API call is made to save guest game results
- **Commit:** `f31a7e6`

---

## Phase 10: Social Features

### 10.1 — Public profile page (`/u/[username]`)
- [ ] Username, avatar, stats per difficulty, recent activity
- [ ] Follower / following counts
- [ ] Earned badges
- [ ] Visible to anyone (no login required)
- [ ] **Tests (`app/u/ProfilePage.test.tsx`):**
  - Page renders with username from URL
  - Stats display for each difficulty (puzzles solved, best time, avg time)
  - Recent activity shows last 10 completions
  - Follower and following counts displayed
  - Badges section shows earned achievements
- **Commit:**

### 10.2 — Follow system
- [ ] Follow / unfollow button on profile pages
- [ ] Follower and following counts update
- [ ] In-app notification on follow
- [ ] **Tests (`server/trpc/follow.test.ts`):**
  - `follow` mutation creates a row in `follows`
  - `unfollow` mutation deletes the row
  - Cannot follow yourself
  - Duplicate follow is a no-op (or returns error gracefully)
  - Following triggers a notification for the followed user
- **Commit:**

### 10.3 — Friend feed
- [ ] Feed of recent completions from followed users
- [ ] Each item: username, difficulty, time, timestamp
- [ ] Accessible from main nav
- [ ] **Tests (`server/trpc/feed.test.ts`):**
  - Feed returns games from followed users only
  - Feed excludes games from non-followed users
  - Feed items are ordered by most recent first
  - Feed is empty if user follows no one
- **Commit:**

### 10.4 — Challenges
- [ ] After completing a random puzzle, "Challenge a friend" option
- [ ] Challenge creates a record with seed and challenger's time
- [ ] Challenged user receives notification
- [ ] Challenge page shows both results and winner
- [ ] Daily puzzles cannot be used for challenges
- [ ] **Tests (`server/trpc/challenge.test.ts`):**
  - Creating a challenge inserts a row in `challenges` with correct seed and time
  - Challenged user receives a `challenge_received` notification
  - Completing a challenge updates `challenged_time` and sets status to `completed`
  - Challenge page shows both times and highlights the winner
  - Attempting to challenge with a daily puzzle seed is rejected
- **Commit:**

---

## Phase 11: Leaderboard

### 11.1 — Leaderboard page (`/leaderboard`)
- [ ] Ranked by best daily solve time per difficulty
- [ ] Views: All-time | This week
- [ ] Friends filter: toggle to show only followed users
- [ ] Each row: rank, username, best time, daily puzzles solved
- [ ] Random puzzle results excluded
- [ ] **Tests (`server/trpc/leaderboard.test.ts` + `app/leaderboard/Leaderboard.test.tsx`):**
  - Leaderboard returns users ranked by best time for given difficulty
  - Only daily puzzle results are included (random excluded)
  - "This week" view only includes games from the last 7 days
  - Friends filter returns only followed users' results
  - Each entry includes rank, username, best time, solve count
  - Users with no daily solves do not appear
- **Commit:**

---

## Phase 12: Achievements & Notifications

### 12.1 — Achievement detection & persistence
- [ ] Client-side detection after each game completion
- [ ] tRPC mutation to confirm and save achievement
- [ ] Badge definitions per PRD (First Solve, Speed Demon, Expert Mind, Clean Sheet, Hint-Free, Social Butterfly, Challenger)
- [ ] **Tests (`lib/achievements/achievements.test.ts` + `server/trpc/achievements.test.ts`):**
  - `First Solve` awarded on first completed game
  - `Speed Demon` awarded for Easy < 3 min
  - `Expert Mind` awarded for Expert < 10 min
  - `Clean Sheet` awarded for 0 errors
  - `Hint-Free` awarded for 0 hints
  - `Social Butterfly` awarded when following 5+ users
  - `Challenger` awarded on first challenge issued
  - Duplicate achievements are not created (unique constraint)
  - Achievement triggers a notification
- **Commit:**

### 12.2 — Notifications system
- [ ] Bell icon in header with unread badge count
- [ ] Notification types: follow, challenge_received, challenge_result, achievement
- [ ] Notifications marked read on view
- [ ] **Tests (`server/trpc/notifications.test.ts` + `components/social/Notifications.test.tsx`):**
  - Unread count reflects actual unread notifications
  - Opening notifications marks them as read
  - Each notification type renders correctly (follow, challenge, achievement)
  - Notifications are sorted by most recent first
  - Only own notifications are returned (RLS)
- **Commit:**

---

## Phase 13: Admin Panel

### 13.1 — Admin route protection & invite management
- [ ] `/admin` accessible only to `is_admin = true` users
- [ ] Generate new invite links with copy button
- [ ] View pending and used invites
- [ ] Revoke unused codes
- [ ] **Tests (`app/admin/AdminPage.test.tsx` + `server/trpc/admin.test.ts`):**
  - Non-admin users are redirected away from `/admin`
  - Admin can generate an invite code (API returns code + link)
  - Invite list shows status (pending / used / expired)
  - Revoking an unused invite deletes or invalidates it
  - Revoking an already-used invite is a no-op
- **Commit:**

### 13.2 — Admin user list
- [ ] View all registered users: username, join date, game count
- [ ] **Tests (`server/trpc/admin.test.ts`):**
  - Admin can fetch the full user list
  - Non-admin cannot fetch the user list
  - Each user entry includes username, created_at, and game count
- **Commit:**

---

## Phase 14: Sharing & OG Images

### 14.1 — Result card sharing
- [ ] "Share" button on completion modal generates a URL: `/result/[gameId]`
- [ ] Result page displays: time, difficulty, errors, username, daily/random badge
- [ ] Copy link + Web Share API (mobile)
- [ ] **Tests (`app/result/ResultPage.test.tsx`):**
  - Page renders game result for valid gameId
  - Invalid gameId shows 404 or error
  - Copy button copies URL to clipboard
  - Result displays correct stats (time, difficulty, errors, hints)
- **Commit:**

### 14.2 — OG image generation
- [ ] Vercel OG (satori) generates a styled image per result
- [ ] Image includes: Nonet logo, difficulty, time, errors, username
- [ ] Correct `<meta>` tags for social sharing (og:image, og:title, og:description)
- [ ] **Tests (`app/result/og/route.test.ts`):**
  - OG route returns an image (content-type: image/png)
  - Image includes the correct game stats (visual or snapshot test)
  - Meta tags are present in the result page HTML
- **Commit:**

---

## Phase 15: Audio & Polish

### 15.1 — Sound effects
- [ ] Soft click on cell selection
- [ ] Chime on puzzle completion
- [ ] Off by default; toggle in settings, preference saved to `localStorage`
- [ ] **Tests (`lib/store/audioStore.test.ts`):**
  - Audio defaults to off
  - Toggling audio saves preference to `localStorage`
  - Preference restored on load
- **Commit:**

### 15.2 — Rate limiting
- [ ] Upstash Redis rate limiting on sensitive endpoints: auth, invite validation, game submission
- [ ] **Tests (`server/middleware/rateLimit.test.ts`):**
  - Requests within limit succeed
  - Requests exceeding limit return 429
- **Commit:**

### 15.3 — Cross-browser & final QA
- [ ] Test on Chrome (desktop), Safari (mobile), Firefox
- [ ] Verify responsive layouts at key breakpoints
- [ ] WCAG AA contrast check on all text
- [ ] Full E2E test: new game → play → complete → share → leaderboard
- [ ] **Tests (Playwright E2E):**
  - `e2e/full-game-flow.spec.ts` — guest plays a game start to finish
  - `e2e/daily-puzzle.spec.ts` — daily puzzle flow including lockout
  - `e2e/auth-flow.spec.ts` — invite → sign-up → login → play → save
- **Commit:**

---

## Blockers

_None yet. Add issues here as they are discovered._

<!--
Format:
- [ ] **Blocker description** — discovered during Task X.Y, blocks Task A.B
  - Workaround (if any):
  - Resolution:
-->
