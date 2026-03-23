import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();
const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 1000).toISOString();

const mockInvites = [
  { id: "inv-1", code: "abcd-1234", status: "pending", created_at: NOW, expires_at: FUTURE, used_by: null, used_at: null },
  { id: "inv-2", code: "efgh-5678", status: "used",    created_at: NOW, expires_at: FUTURE, used_by: "user-x", used_at: NOW },
  { id: "inv-3", code: "ijkl-9012", status: "expired", created_at: PAST, expires_at: PAST, used_by: null, used_at: null },
];

// ---------------------------------------------------------------------------
// Controllable mock state
// ---------------------------------------------------------------------------

let mockMeData: { id: string; username: string; is_admin: boolean } | null = {
  id: "admin-id",
  username: "admin",
  is_admin: true,
};
let mockMeLoading = false;
let mockListData = mockInvites;
let mockListLoading = false;

const mockGenerateMutate = jest.fn();
const mockRevokeMutate = jest.fn();
const mockInvalidateInviteList = jest.fn();

let generateOnSuccess: ((result: { id: string; code: string; expiresAt: string }) => void) | null = null;
let revokeOnSuccess: (() => void) | null = null;

// ---------------------------------------------------------------------------
// trpc mock
// ---------------------------------------------------------------------------

jest.mock("@/lib/trpc/client", () => ({
  trpc: {
    profile: {
      getMe: {
        useQuery: (_input: undefined, _opts: unknown) => ({
          data: mockMeData,
          isLoading: mockMeLoading,
        }),
      },
    },
    invite: {
      list: {
        useQuery: (_input: undefined, _opts: unknown) => ({
          data: mockListData,
          isLoading: mockListLoading,
        }),
      },
      generate: {
        useMutation: (opts: { onSuccess?: (result: { id: string; code: string; expiresAt: string }) => void }) => {
          generateOnSuccess = opts?.onSuccess ?? null;
          return {
            mutate: (...args: unknown[]) => mockGenerateMutate(...args),
            isPending: false,
            error: null,
          };
        },
      },
      revoke: {
        useMutation: (opts: { onSuccess?: () => void }) => {
          revokeOnSuccess = opts?.onSuccess ?? null;
          return {
            mutate: (...args: unknown[]) => mockRevokeMutate(...args),
            isPending: false,
          };
        },
      },
    },
    useUtils: () => ({
      invite: {
        list: { invalidate: mockInvalidateInviteList },
      },
    }),
  },
}));

// ---------------------------------------------------------------------------
// Component import (after mock)
// ---------------------------------------------------------------------------

import AdminPage from "./page";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

// Mock navigator.clipboard
const mockClipboardWriteText = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockClipboardWriteText },
  writable: true,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMeData = { id: "admin-id", username: "admin", is_admin: true };
  mockMeLoading = false;
  mockListData = mockInvites;
  mockListLoading = false;
  generateOnSuccess = null;
  revokeOnSuccess = null;
  mockClipboardWriteText.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AdminPage — access control", () => {
  test("non-admin user sees access denied", () => {
    mockMeData = { id: "user-id", username: "regular", is_admin: false };
    render(<AdminPage />);
    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-panel")).not.toBeInTheDocument();
  });

  test("unauthenticated user (null profile) sees access denied", () => {
    mockMeData = null;
    render(<AdminPage />);
    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-panel")).not.toBeInTheDocument();
  });

  test("admin user sees admin panel", () => {
    render(<AdminPage />);
    expect(screen.getByTestId("admin-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("access-denied")).not.toBeInTheDocument();
  });

  test("loading state shows spinner, not panel or denied", () => {
    mockMeLoading = true;
    mockMeData = null;
    render(<AdminPage />);
    expect(screen.queryByTestId("admin-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("access-denied")).not.toBeInTheDocument();
  });
});

describe("AdminPage — generate invite", () => {
  test("generate button calls generate mutation", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByTestId("generate-invite"));
    expect(mockGenerateMutate).toHaveBeenCalledTimes(1);
  });

  test("generated code is shown after successful mutation", () => {
    render(<AdminPage />);
    // Simulate onSuccess callback being triggered
    generateOnSuccess!({ id: "new-inv", code: "wxyz-4321", expiresAt: FUTURE });
    // Re-render is triggered by state update via onSuccess
    // We need to call generate first to register the callback, then trigger it
    // Let's trigger via fireEvent + manual onSuccess
    fireEvent.click(screen.getByTestId("generate-invite"));
    generateOnSuccess!({ id: "new-inv", code: "wxyz-4321", expiresAt: FUTURE });

    waitFor(() => {
      expect(screen.getByTestId("generated-code")).toBeInTheDocument();
      expect(screen.getByTestId("generated-code").textContent).toBe("wxyz-4321");
    });
  });

  test("copy link button copies invite URL to clipboard", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByTestId("generate-invite"));
    generateOnSuccess!({ id: "new-inv", code: "test-code", expiresAt: FUTURE });

    await waitFor(() => {
      expect(screen.getByTestId("copy-link")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("copy-link"));

    await waitFor(() => {
      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        expect.stringContaining("/invite/test-code")
      );
    });
  });

  test("generate button invalidates invite list on success", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByTestId("generate-invite"));
    generateOnSuccess!({ id: "new-inv", code: "abcd-0000", expiresAt: FUTURE });
    expect(mockInvalidateInviteList).toHaveBeenCalled();
  });
});

describe("AdminPage — invite list", () => {
  test("invite list renders all invites", () => {
    render(<AdminPage />);
    expect(screen.getByTestId("invite-list")).toBeInTheDocument();
    expect(screen.getByTestId("invite-item-inv-1")).toBeInTheDocument();
    expect(screen.getByTestId("invite-item-inv-2")).toBeInTheDocument();
    expect(screen.getByTestId("invite-item-inv-3")).toBeInTheDocument();
  });

  test("invite list shows correct status for each invite", () => {
    render(<AdminPage />);
    expect(screen.getByTestId("invite-status-inv-1").textContent).toBe("pending");
    expect(screen.getByTestId("invite-status-inv-2").textContent).toBe("used");
    expect(screen.getByTestId("invite-status-inv-3").textContent).toBe("expired");
  });

  test("revoke button only present for pending invites", () => {
    render(<AdminPage />);
    expect(screen.getByTestId("revoke-inv-1")).toBeInTheDocument();
    expect(screen.queryByTestId("revoke-inv-2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("revoke-inv-3")).not.toBeInTheDocument();
  });

  test("revoking a pending invite calls revoke mutation with correct id", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByTestId("revoke-inv-1"));
    expect(mockRevokeMutate).toHaveBeenCalledWith({ id: "inv-1" });
  });

  test("revoke mutation success invalidates invite list", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByTestId("revoke-inv-1"));
    revokeOnSuccess!();
    expect(mockInvalidateInviteList).toHaveBeenCalled();
  });

  test("shows empty state when no invites", () => {
    mockListData = [];
    render(<AdminPage />);
    expect(screen.queryByTestId("invite-list")).not.toBeInTheDocument();
    expect(screen.getByText("No invites yet.")).toBeInTheDocument();
  });
});
