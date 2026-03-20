import { render, screen } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useParams: () => ({ username: "testplayer" }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// --- Mock tRPC data ---
const mockProfile = {
  id: "user-123",
  username: "testplayer",
  display_name: "Test Player",
  avatar_url: null,
  created_at: "2026-01-01T00:00:00Z",
};

const mockStats = [
  { difficulty: "easy", solved: 12, bestTime: 95, avgTime: 130 },
  { difficulty: "medium", solved: 8, bestTime: 210, avgTime: 280 },
  { difficulty: "hard", solved: 3, bestTime: 450, avgTime: 500 },
  { difficulty: "expert", solved: 0, bestTime: null, avgTime: null },
];

const mockActivity = [
  { id: "g1", difficulty: "easy", time_seconds: 100, is_daily: true, completed_at: new Date().toISOString() },
  { id: "g2", difficulty: "medium", time_seconds: 250, is_daily: false, completed_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "g3", difficulty: "hard", time_seconds: 480, is_daily: false, completed_at: new Date(Date.now() - 86400000).toISOString() },
];

const mockFollowCounts = { followers: 15, following: 8 };

const mockAchievements = [
  { badge_id: "first_solve", earned_at: "2026-01-02T00:00:00Z" },
  { badge_id: "clean_sheet", earned_at: "2026-01-03T00:00:00Z" },
  { badge_id: "speed_demon", earned_at: "2026-01-05T00:00:00Z" },
];

let mockProfileError: { message: string } | null = null;
let mockProfileLoading = false;

jest.mock("@/lib/trpc/client", () => ({
  trpc: {
    profile: {
      getByUsername: {
        useQuery: () => ({
          data: mockProfileError || mockProfileLoading ? undefined : mockProfile,
          isLoading: mockProfileLoading,
          error: mockProfileError,
          refetch: jest.fn(),
        }),
      },
      getStats: {
        useQuery: () => ({
          data: mockStats,
          isLoading: false,
        }),
      },
      getRecentActivity: {
        useQuery: () => ({
          data: mockActivity,
          isLoading: false,
        }),
      },
      getFollowCounts: {
        useQuery: () => ({
          data: mockFollowCounts,
          isLoading: false,
        }),
      },
      getAchievements: {
        useQuery: () => ({
          data: mockAchievements,
          isLoading: false,
        }),
      },
      backfillAvatar: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
      updateProfile: {
        useMutation: (opts: { onSuccess?: () => void }) => ({
          mutate: jest.fn(() => { if (opts?.onSuccess) opts.onSuccess(); }),
          isPending: false,
        }),
      },
    },
  },
}));

import ProfilePage from "@/app/u/[username]/page";

beforeEach(() => {
  mockProfileError = null;
  mockProfileLoading = false;
});

describe("ProfilePage", () => {
  test("renders with username from URL", () => {
    render(<ProfilePage />);

    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    expect(screen.getByTestId("profile-username")).toHaveTextContent("testplayer");
  });

  test("displays avatar initial when no avatar_url", () => {
    render(<ProfilePage />);

    expect(screen.getByTestId("profile-avatar")).toHaveTextContent("T");
  });

  test("displays display name", () => {
    render(<ProfilePage />);

    expect(screen.getByTestId("profile-display-name")).toHaveTextContent("Test Player");
  });

  test("stats display for each difficulty (puzzles solved, best time, avg time)", () => {
    render(<ProfilePage />);

    const statsGrid = screen.getByTestId("stats-grid");
    expect(statsGrid).toBeInTheDocument();

    // Easy stats
    const easyCard = screen.getByTestId("stats-easy");
    expect(easyCard).toHaveTextContent("12");
    expect(easyCard).toHaveTextContent("1:35"); // 95 seconds
    expect(easyCard).toHaveTextContent("2:10"); // 130 seconds

    // Medium stats
    const mediumCard = screen.getByTestId("stats-medium");
    expect(mediumCard).toHaveTextContent("8");

    // Hard stats
    const hardCard = screen.getByTestId("stats-hard");
    expect(hardCard).toHaveTextContent("3");

    // Expert stats — 0 solved
    const expertCard = screen.getByTestId("stats-expert");
    expect(expertCard).toHaveTextContent("0");
  });

  test("recent activity shows completions", () => {
    render(<ProfilePage />);

    const activityList = screen.getByTestId("activity-list");
    expect(activityList).toBeInTheDocument();

    const items = screen.getAllByTestId("activity-item");
    expect(items).toHaveLength(3);

    // First item should show Easy, daily badge
    expect(items[0]).toHaveTextContent("Easy");
    expect(items[0]).toHaveTextContent("1:40"); // 100 seconds
    expect(items[0]).toHaveTextContent("Daily");
  });

  test("follower and following counts displayed", () => {
    render(<ProfilePage />);

    expect(screen.getByTestId("follower-count")).toHaveTextContent("15");
    expect(screen.getByTestId("following-count")).toHaveTextContent("8");
  });

  test("badges section shows earned achievements", () => {
    render(<ProfilePage />);

    const badgesList = screen.getByTestId("badges-list");
    expect(badgesList).toBeInTheDocument();

    expect(screen.getByTestId("badge-first_solve")).toHaveTextContent("First Solve");
    expect(screen.getByTestId("badge-clean_sheet")).toHaveTextContent("Clean Sheet");
    expect(screen.getByTestId("badge-speed_demon")).toHaveTextContent("Speed Demon");
  });

  test("shows not-found state for invalid username", () => {
    mockProfileError = { message: "Not found" };

    render(<ProfilePage />);

    expect(screen.getByTestId("profile-not-found")).toBeInTheDocument();
    expect(screen.getByText(/No profile found/)).toBeInTheDocument();
  });

  test("shows loading state", () => {
    mockProfileLoading = true;

    render(<ProfilePage />);

    expect(screen.getByTestId("profile-loading")).toBeInTheDocument();
  });
});
