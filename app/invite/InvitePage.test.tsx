import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ code: "test-invite-code" }),
  useRouter: () => ({ push: mockPush }),
}));

// Mock tRPC client hooks
const mockValidateData = { valid: true, expiresAt: new Date(Date.now() + 86400000).toISOString() };
let mockValidateLoading = false;
const mockSignUpMutate = jest.fn();
let mockSignUpPending = false;
const mockOAuthMutate = jest.fn();
let mockOAuthPending = false;

jest.mock("@/lib/trpc/client", () => ({
  trpc: {
    auth: {
      validateInvite: {
        useQuery: () => ({
          data: mockValidateData,
          isLoading: mockValidateLoading,
        }),
      },
      signUp: {
        useMutation: (opts: { onSuccess?: () => void; onError?: (err: { message: string }) => void }) => ({
          mutate: (...args: unknown[]) => {
            mockSignUpMutate(...args);
            // Simulate success by default
            if (opts.onSuccess) opts.onSuccess();
          },
          isPending: mockSignUpPending,
        }),
      },
      getOAuthUrl: {
        useMutation: (opts: { onSuccess?: (data: { url: string }) => void; onError?: (err: { message: string }) => void }) => ({
          mutate: (...args: unknown[]) => {
            mockOAuthMutate(...args);
          },
          isPending: mockOAuthPending,
        }),
      },
    },
  },
}));

import InvitePage from "@/app/invite/[code]/page";

beforeEach(() => {
  jest.clearAllMocks();
  mockValidateData.valid = true;
  mockValidateLoading = false;
  mockSignUpPending = false;
  mockOAuthPending = false;
});

describe("InvitePage", () => {
  test("renders with invite code from URL and shows auth selection for valid code", () => {
    render(<InvitePage />);

    expect(screen.getByText("Nonet")).toBeInTheDocument();
    expect(screen.getByTestId("auth-select")).toBeInTheDocument();
    expect(screen.getByTestId("auth-email")).toBeInTheDocument();
    expect(screen.getByTestId("auth-google")).toBeInTheDocument();
    expect(screen.getByTestId("auth-apple")).toBeInTheDocument();
  });

  test("invalid code shows error message", () => {
    mockValidateData.valid = false;

    render(<InvitePage />);

    expect(screen.getByTestId("invalid-code")).toBeInTheDocument();
    expect(screen.getByText("This invite link is invalid or has expired.")).toBeInTheDocument();
    expect(screen.getByTestId("go-home")).toHaveAttribute("href", "/");
  });

  test("valid code shows auth method selection", () => {
    render(<InvitePage />);

    expect(screen.getByTestId("auth-select")).toBeInTheDocument();
    expect(screen.getByText("Sign up with Email")).toBeInTheDocument();
    expect(screen.getByText("Sign up with Google")).toBeInTheDocument();
    expect(screen.getByText("Sign up with Apple")).toBeInTheDocument();
  });

  test("selecting email auth shows email form", () => {
    render(<InvitePage />);

    fireEvent.click(screen.getByTestId("auth-email"));

    expect(screen.getByTestId("email-form")).toBeInTheDocument();
    expect(screen.getByTestId("input-email")).toBeInTheDocument();
    expect(screen.getByTestId("input-password")).toBeInTheDocument();
    expect(screen.getByTestId("input-confirm-password")).toBeInTheDocument();
    expect(screen.getByTestId("email-next")).toBeInTheDocument();
  });

  test("email form validates inputs", () => {
    render(<InvitePage />);

    fireEvent.click(screen.getByTestId("auth-email"));
    fireEvent.click(screen.getByTestId("email-next"));

    expect(screen.getByTestId("error-email")).toBeInTheDocument();
    expect(screen.getByTestId("error-password")).toBeInTheDocument();
  });

  test("email form validates password match", () => {
    render(<InvitePage />);

    fireEvent.click(screen.getByTestId("auth-email"));
    fireEvent.change(screen.getByTestId("input-email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByTestId("input-password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByTestId("input-confirm-password"), { target: { value: "different" } });
    fireEvent.click(screen.getByTestId("email-next"));

    expect(screen.getByTestId("error-confirm-password")).toBeInTheDocument();
  });

  test("after valid email form, username input appears", () => {
    render(<InvitePage />);

    fireEvent.click(screen.getByTestId("auth-email"));
    fireEvent.change(screen.getByTestId("input-email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByTestId("input-password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByTestId("input-confirm-password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("email-next"));

    expect(screen.getByTestId("username-step")).toBeInTheDocument();
    expect(screen.getByTestId("input-username")).toBeInTheDocument();
    expect(screen.getByText("Choose a username")).toBeInTheDocument();
  });

  test("submitting username calls signUp with correct args", async () => {
    render(<InvitePage />);

    // Fill email form
    fireEvent.click(screen.getByTestId("auth-email"));
    fireEvent.change(screen.getByTestId("input-email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByTestId("input-password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByTestId("input-confirm-password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("email-next"));

    // Fill username
    fireEvent.change(screen.getByTestId("input-username"), { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("submit-signup"));

    expect(mockSignUpMutate).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      inviteCode: "test-invite-code",
      username: "testuser",
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("username validation rejects invalid usernames", () => {
    render(<InvitePage />);

    fireEvent.click(screen.getByTestId("auth-email"));
    fireEvent.change(screen.getByTestId("input-email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByTestId("input-password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByTestId("input-confirm-password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("email-next"));

    // Try with too-short username
    fireEvent.change(screen.getByTestId("input-username"), { target: { value: "ab" } });
    fireEvent.click(screen.getByTestId("submit-signup"));

    expect(screen.getByTestId("error-username")).toBeInTheDocument();
    expect(mockSignUpMutate).not.toHaveBeenCalled();
  });

  test("selecting Google OAuth shows username step then calls getOAuthUrl", () => {
    render(<InvitePage />);

    fireEvent.click(screen.getByTestId("auth-google"));

    expect(screen.getByTestId("oauth-username-step")).toBeInTheDocument();
    expect(screen.getByTestId("submit-oauth")).toHaveTextContent(/Google/);

    fireEvent.change(screen.getByTestId("input-username"), { target: { value: "googleuser" } });
    fireEvent.click(screen.getByTestId("submit-oauth"));

    expect(mockOAuthMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        inviteCode: "test-invite-code",
        provider: "google",
        username: "googleuser",
      })
    );
  });

  test("back button returns to auth selection", () => {
    render(<InvitePage />);

    fireEvent.click(screen.getByTestId("auth-email"));
    expect(screen.getByTestId("email-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("back-button"));
    expect(screen.getByTestId("auth-select")).toBeInTheDocument();
  });
});
