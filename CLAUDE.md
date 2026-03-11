# CLAUDE.md — Web Application Building Rules

---

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- **Read `progress.md`** to identify the next incomplete task before starting any work.
- **Read the relevant section of `prd.md`** for the task you are about to implement.

---

## Source of Truth
- `CLAUDE.md` — how to build (conventions, commands, rules, tools)
- `prd.md` — what to build (features, requirements, acceptance criteria)
- `progress.md` — what has been built (tasks, tests, status, commit hashes)
- If a task is not marked `[x]` in `progress.md`, it is not done — regardless of what exists in the codebase.

---

## Build Workflow (Follow This Order Every Session)

1. Read `progress.md` → find the next `[ ]` task
2. Read the relevant `prd.md` section for that task
3. Enter Plan Mode (`Shift+Tab` or `/plan`) → outline implementation + tests → wait for approval
4. Implement the feature
5. Write the corresponding tests
6. Run the tests
7. If tests pass → commit (specific files only, never `git add .`) → update `progress.md` to `[x]` with commit hash
8. If tests fail → fix and re-run → do not update `progress.md` until green
9. Do not move to the next task until the current one is committed and checked off

---

## Testing Tools & Commands

- **Framework:** Jest (unit + integration)
- **E2E:** Playwright
- **Run all tests:** `npm test`
- **Run single file:** `npx jest path/to/file.test.ts`
- **Run E2E:** `npx playwright test`
- **Coverage:** `npm run test:coverage` (must stay above 80%)

---

## Testing Rules
- Every new feature requires a corresponding test file
- Write tests before or alongside implementation (TDD preferred)
- Tests must pass before any commit is made
- Do not use mocks unless absolutely necessary — prefer real implementations in test environments
- Never mark a task complete in `progress.md` unless all its listed tests pass
- If a blocker is found, add it to the Blockers section

---

## Git & Version Control Rules
- Never commit with failing tests
- Never use `git add .` — always stage specific files relevant to the feature
- Commit message format: `feat: <what was built and tested>`
- Record the commit hash in `progress.md` when marking a task complete
- Push only when explicitly instructed, or after 3+ commits have accumulated

---

## Context Management
- Keep sessions focused on one task at a time (30–45 minutes ideal)
- Run `/cost` regularly to monitor token usage
- Run `/compact` at logical breakpoints (after completing a task), not mid-feature
- When compacting: `/compact Preserve all file paths, error messages, and list of modified files`
- Start a new session for unrelated work — do not mix tasks in one session

---

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

---

## Screenshot Workflow
- Puppeteer is installed at `C:\Claude_Projects\sudoku\node_modules\puppeteer`. Chrome cache is at `C:\Users\User\.cache\puppeteer\`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

---

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

---

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

---

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

---

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

---

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
- Do not commit with failing tests
- Do not use `git add .`
- Do not mark tasks complete in `progress.md` without a passing test and a commit hash
