import { test, expect } from "@playwright/test";

/**
 * Helper: get the puzzle solution and empty cells from the Zustand game store.
 */
async function getPuzzleData(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const store = (window as any).__GAME_STORE__;
    if (!store) throw new Error("Game store not exposed on window");
    const state = store.getState();
    const solution: number[][] = state.puzzle.solution;
    const board: number[][] = state.currentBoard;
    const emptyCells: { row: number; col: number; digit: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          emptyCells.push({ row: r, col: c, digit: solution[r][c] });
        }
      }
    }
    return { emptyCells };
  });
}

/**
 * Helper: solve the puzzle by clicking each empty cell and pressing the correct digit.
 */
async function solvePuzzle(page: import("@playwright/test").Page) {
  const { emptyCells } = await getPuzzleData(page);
  for (const { row, col, digit } of emptyCells) {
    const cell = page.locator(`[data-row="${row}"][data-col="${col}"]`);
    await cell.click();
    await page.keyboard.press(`Digit${digit}`);
  }
}

test.describe("Daily Puzzle Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await expect(page.locator("[data-cell]")).toHaveCount(81);
  });

  test("daily puzzle completion triggers lockout for same difficulty", async ({ page }) => {
    // Start a new daily Easy game
    await page.getByTestId("new-game-button").click();
    await expect(page.getByTestId("new-game-modal")).toBeVisible();

    // Select Easy
    await page.locator('[data-difficulty="easy"]').click();
    await expect(page.getByTestId("step-puzzle-type")).toBeVisible();

    // Select Daily Puzzle
    await page.locator('[data-puzzle-type="daily"]').click();
    await expect(page.getByTestId("new-game-modal")).not.toBeVisible();

    // Verify this is a daily game
    const isDaily = await page.evaluate(() => {
      return (window as any).__GAME_STORE__.getState().isDaily;
    });
    expect(isDaily).toBe(true);

    // Solve the puzzle
    await solvePuzzle(page);

    // Verify completion modal shows Daily badge
    await expect(page.getByTestId("completion-modal")).toBeVisible();
    await expect(page.getByTestId("puzzle-badge")).toContainText("Daily");

    // Close completion modal via "New Game" button
    await page.locator('[data-action="new-game"]').click();
    await expect(page.getByTestId("completion-modal")).not.toBeVisible();

    // New Game modal should now be open
    await expect(page.getByTestId("new-game-modal")).toBeVisible();

    // Select Easy again
    await page.locator('[data-difficulty="easy"]').click();
    await expect(page.getByTestId("step-puzzle-type")).toBeVisible();

    // Verify daily puzzle button is disabled/locked for Easy
    const dailyButton = page.locator('[data-puzzle-type="daily"]');
    await expect(dailyButton).toBeDisabled();
    await expect(page.getByTestId("daily-locked")).toBeVisible();
    await expect(page.getByTestId("daily-countdown")).toBeVisible();

    // Go back and select Medium — daily should NOT be locked
    await page.locator('[data-action="back"]').click();
    await page.locator('[data-difficulty="medium"]').click();
    await expect(page.getByTestId("step-puzzle-type")).toBeVisible();

    const mediumDailyButton = page.locator('[data-puzzle-type="daily"]');
    await expect(mediumDailyButton).not.toBeDisabled();
  });

  test("daily puzzle lockout persists across page reloads", async ({ page }) => {
    // Start and complete a daily Easy game
    await page.getByTestId("new-game-button").click();
    await page.locator('[data-difficulty="easy"]').click();
    await page.locator('[data-puzzle-type="daily"]').click();
    await solvePuzzle(page);

    // Close modal
    await expect(page.getByTestId("completion-modal")).toBeVisible();
    await page.locator('[data-action="play-again"]').click();
    await expect(page.getByTestId("completion-modal")).not.toBeVisible();

    // Reload the page
    await page.reload();
    await expect(page.locator("[data-cell]")).toHaveCount(81);

    // Check that daily Easy is still locked
    await page.getByTestId("new-game-button").click();
    await page.locator('[data-difficulty="easy"]').click();
    await expect(page.getByTestId("step-puzzle-type")).toBeVisible();

    const dailyButton = page.locator('[data-puzzle-type="daily"]');
    await expect(dailyButton).toBeDisabled();
    await expect(page.getByTestId("daily-locked")).toBeVisible();
  });
});
