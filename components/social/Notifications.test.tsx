import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock data
const mockNotifications = [
  {
    id: "n1",
    type: "achievement",
    payload: { badge_id: "first_solve", badge_name: "First Solve", badge_description: "Complete your first puzzle" },
    read: false,
    created_at: new Date(Date.now() - 1000).toISOString(),
  },
  {
    id: "n2",
    type: "challenge_result",
    payload: { challenge_id: "c1", challenged_username: "alice", winner: "challenged", challenger_time: 200, challenged_time: 150 },
    read: false,
    created_at: new Date(Date.now() - 2000).toISOString(),
  },
  {
    id: "n3",
    type: "challenge_received",
    payload: { challenge_id: "c2", challenger_username: "bob", difficulty: "hard" },
    read: true,
    created_at: new Date(Date.now() - 3000).toISOString(),
  },
  {
    id: "n4",
    type: "follow",
    payload: { follower_id: "u1", follower_username: "charlie" },
    read: true,
    created_at: new Date(Date.now() - 4000).toISOString(),
  },
];

const mockMarkAsReadMutate = jest.fn();
const mockInvalidateUnreadCount = jest.fn();
const mockInvalidateList = jest.fn();

let mockListData = mockNotifications;
let mockUnreadCount = 2;
let mockListEnabled = true;

jest.mock("@/lib/trpc/client", () => ({
  trpc: {
    notification: {
      list: {
        useQuery: (_input: undefined, opts: { enabled: boolean }) => {
          mockListEnabled = opts?.enabled ?? true;
          return {
            data: mockListEnabled ? mockListData : [],
            isLoading: false,
          };
        },
      },
      getUnreadCount: {
        useQuery: () => ({
          data: { count: mockUnreadCount },
        }),
        invalidate: mockInvalidateUnreadCount,
      },
      markAsRead: {
        useMutation: (opts: { onSuccess?: () => void }) => ({
          mutate: (...args: unknown[]) => {
            mockMarkAsReadMutate(...args);
            if (opts?.onSuccess) opts.onSuccess();
          },
          isPending: false,
        }),
      },
    },
    useUtils: () => ({
      notification: {
        getUnreadCount: { invalidate: mockInvalidateUnreadCount },
        list: { invalidate: mockInvalidateList },
      },
    }),
  },
}));

import Header from "@/components/layout/Header";
import NotificationsPanel from "@/components/social/NotificationsPanel";

// Mock themeStore
jest.mock("@/lib/store/themeStore", () => ({
  useThemeStore: (selector: (s: { theme: string; toggle: () => void }) => unknown) =>
    selector({ theme: "light", toggle: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockListData = mockNotifications;
  mockUnreadCount = 2;
});

describe("NotificationsPanel", () => {
  test("renders nothing when closed", () => {
    const { container } = render(
      <NotificationsPanel open={false} onClose={jest.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  test("renders panel when open", () => {
    render(<NotificationsPanel open={true} onClose={jest.fn()} />);
    expect(screen.getByTestId("notifications-panel")).toBeInTheDocument();
  });

  test("each notification type renders correct message", () => {
    render(<NotificationsPanel open={true} onClose={jest.fn()} />);

    // follow
    expect(screen.getByText("charlie followed you")).toBeInTheDocument();
    // challenge_received
    expect(screen.getByText("bob challenged you to a hard puzzle")).toBeInTheDocument();
    // challenge_result (winner === "challenged" means "you won")
    expect(screen.getByText("Challenge result: you won!")).toBeInTheDocument();
    // achievement
    expect(screen.getByText("Achievement unlocked: First Solve")).toBeInTheDocument();
  });

  test("notifications are sorted by most recent first", () => {
    render(<NotificationsPanel open={true} onClose={jest.fn()} />);

    const items = screen.getAllByTestId(/^notification-item-/);
    expect(items).toHaveLength(4);
    // Order: achievement (newest), challenge_result, challenge_received, follow (oldest)
    expect(items[0].getAttribute("data-testid")).toBe("notification-item-achievement");
    expect(items[1].getAttribute("data-testid")).toBe("notification-item-challenge_result");
    expect(items[2].getAttribute("data-testid")).toBe("notification-item-challenge_received");
    expect(items[3].getAttribute("data-testid")).toBe("notification-item-follow");
  });

  test("unread notifications have visual indicator", () => {
    render(<NotificationsPanel open={true} onClose={jest.fn()} />);

    const unreadDots = screen.getAllByTestId("unread-dot");
    // n1 and n2 are unread
    expect(unreadDots).toHaveLength(2);
  });

  test("opening panel marks all notifications as read", () => {
    render(<NotificationsPanel open={true} onClose={jest.fn()} />);

    expect(mockMarkAsReadMutate).toHaveBeenCalledWith({ all: true });
  });

  test("does not call markAsRead when no unread notifications", () => {
    mockListData = mockNotifications.map((n) => ({ ...n, read: true }));

    render(<NotificationsPanel open={true} onClose={jest.fn()} />);

    expect(mockMarkAsReadMutate).not.toHaveBeenCalled();
  });

  test("shows empty state when no notifications", () => {
    mockListData = [];

    render(<NotificationsPanel open={true} onClose={jest.fn()} />);

    expect(screen.getByTestId("notifications-empty")).toBeInTheDocument();
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });

  test("closes on Escape key", () => {
    const onClose = jest.fn();
    render(<NotificationsPanel open={true} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });
});

describe("Header notification bell", () => {
  test("renders unread badge with correct count", () => {
    mockUnreadCount = 5;
    render(<Header />);

    const badge = screen.getByTestId("unread-badge");
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe("5");
  });

  test("does not render badge when unread count is 0", () => {
    mockUnreadCount = 0;
    render(<Header />);

    expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument();
  });

  test("clicking bell toggles notifications panel", () => {
    render(<Header />);

    const bellBtn = screen.getByTestId("nav-notifications");
    expect(screen.queryByTestId("notifications-panel")).not.toBeInTheDocument();

    fireEvent.click(bellBtn);
    expect(screen.getByTestId("notifications-panel")).toBeInTheDocument();

    fireEvent.click(bellBtn);
    expect(screen.queryByTestId("notifications-panel")).not.toBeInTheDocument();
  });

  test("badge shows 99+ for counts over 99", () => {
    mockUnreadCount = 150;
    render(<Header />);

    const badge = screen.getByTestId("unread-badge");
    expect(badge.textContent).toBe("99+");
  });
});
