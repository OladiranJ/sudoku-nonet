import { test, expect } from "@playwright/test";

test.describe("Auth Flow — Invite Sign-Up", () => {
  test("invalid invite code shows error message", async ({ page }) => {
    // Mock the tRPC invite validation to return invalid
    await page.route("**/api/trpc/**", async (route) => {
      const url = route.request().url();
      if (url.includes("auth.validateInvite")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              result: {
                data: { valid: false },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/invite/invalid-test-code");

    // Verify invalid code error is shown
    await expect(page.getByTestId("invalid-code")).toBeVisible();
    await expect(page.getByText("Invalid Invite")).toBeVisible();
    await expect(
      page.getByText("This invite link is invalid or has expired.")
    ).toBeVisible();

    // Verify "Go to Nonet" link exists
    await expect(page.getByTestId("go-home")).toBeVisible();
  });

  test("valid invite code shows auth method selection", async ({ page }) => {
    // Mock the tRPC invite validation to return valid
    await page.route("**/api/trpc/**", async (route) => {
      const url = route.request().url();
      if (url.includes("auth.validateInvite")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              result: {
                data: { valid: true },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/invite/valid-test-code");

    // Verify auth method selection appears
    await expect(page.getByTestId("auth-select")).toBeVisible();
    await expect(page.getByTestId("auth-email")).toBeVisible();
    await expect(page.getByTestId("auth-google")).toBeVisible();
    await expect(page.getByTestId("auth-apple")).toBeVisible();
  });

  test("email sign-up flow with form validation", async ({ page }) => {
    // Mock valid invite
    await page.route("**/api/trpc/**", async (route) => {
      const url = route.request().url();
      if (url.includes("auth.validateInvite")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              result: {
                data: { valid: true },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/invite/valid-test-code");
    await expect(page.getByTestId("auth-select")).toBeVisible();

    // Click email auth
    await page.getByTestId("auth-email").click();
    await expect(page.getByTestId("email-form")).toBeVisible();

    // Submit empty form — should show validation errors
    await page.getByTestId("email-next").click();
    await expect(page.getByTestId("error-email")).toBeVisible();
    await expect(page.getByTestId("error-password")).toBeVisible();

    // Fill in email only, short password
    await page.getByTestId("input-email").fill("test@example.com");
    await page.getByTestId("input-password").fill("short");
    await page.getByTestId("input-confirm-password").fill("short");
    await page.getByTestId("email-next").click();
    await expect(page.getByTestId("error-password")).toContainText(
      "at least 8 characters"
    );

    // Fill valid credentials with mismatched passwords
    await page.getByTestId("input-password").fill("validpassword123");
    await page.getByTestId("input-confirm-password").fill("different123");
    await page.getByTestId("email-next").click();
    await expect(page.getByTestId("error-confirm-password")).toContainText(
      "do not match"
    );

    // Fill valid matching credentials
    await page.getByTestId("input-confirm-password").fill("validpassword123");
    await page.getByTestId("email-next").click();

    // Should advance to username step
    await expect(page.getByTestId("username-step")).toBeVisible();
    await expect(page.getByText("Choose a username")).toBeVisible();

    // Submit empty username — should show error
    await page.getByTestId("submit-signup").click();
    await expect(page.getByTestId("error-username")).toBeVisible();

    // Enter short username
    await page.getByTestId("input-username").fill("ab");
    await page.getByTestId("submit-signup").click();
    await expect(page.getByTestId("error-username")).toContainText(
      "at least 3 characters"
    );

    // Enter valid username — the mutation will fire (mocked endpoint won't respond, but UI flow is validated)
    await page.getByTestId("input-username").fill("testuser123");
    await expect(page.getByTestId("submit-signup")).toBeVisible();
  });

  test("Google OAuth flow shows username picker", async ({ page }) => {
    // Mock valid invite
    await page.route("**/api/trpc/**", async (route) => {
      const url = route.request().url();
      if (url.includes("auth.validateInvite")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              result: {
                data: { valid: true },
              },
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/invite/valid-test-code");
    await expect(page.getByTestId("auth-select")).toBeVisible();

    // Click Google auth
    await page.getByTestId("auth-google").click();

    // Should show username picker step for OAuth
    await expect(page.getByTestId("oauth-username-step")).toBeVisible();
    await expect(page.getByText("Choose a username")).toBeVisible();
    await expect(page.getByText("Continue with Google")).toBeVisible();

    // Verify back button returns to auth selection
    await page.getByTestId("back-button").click();
    await expect(page.getByTestId("auth-select")).toBeVisible();
  });
});
