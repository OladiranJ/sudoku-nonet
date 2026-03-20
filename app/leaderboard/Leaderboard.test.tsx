/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockEntries = [
  {
    rank: 1,
    userId: "user-1",
    username: "speedster",
    avatarUrl: null,
    bestTime: 95,
    solveCount: 12,
  },
  {
    rank: 2,
    userId: "user-2",
    username: "puzzler",
    avatarUrl: null,
    bestTime: 140,
    solveCount: 5,
  },
];

let mockData: { entries: typeof mockEntries } | undefined = { entries: mockEntries };
let mockIsLoading = false;

jest.mock("@/lib/trpc/client", () => ({
  trpc: {
    leaderboard: {
      getLeaderboard: {
        useQuery: () => ({
          data: mockIsLoading ? undefined : mockData,
          isLoading: mockIsLoading,
          error: null,
          refetch: jest.fn(),
        }),
      },
    },
  },
}));

// Mock next/link to render a simple anchor
jest.mock("next/link", () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  );
});

import LeaderboardPage from "./page";

beforeEach(() => {
  mockData = { entries: mockEntries };
  mockIsLoading = false;
  jest.clearAllMocks();
});

describe("LeaderboardPage", () => {
  test("renders difficulty tabs for all 4 difficulties", () => {
    render(<LeaderboardPage />);
    expect(screen.getByTestId("tab-easy")).toBeInTheDocument();
    expect(screen.getByTestId("tab-medium")).toBeInTheDocument();
    expect(screen.getByTestId("tab-hard")).toBeInTheDocument();
    expect(screen.getByTestId("tab-expert")).toBeInTheDocument();
  });

  test("renders leaderboard entries with rank, username, time, and count", () => {
    render(<LeaderboardPage />);

    const entries = screen.getAllByTestId("leaderboard-entry");
    expect(entries).toHaveLength(2);

    const ranks = screen.getAllByTestId("entry-rank");
    expect(ranks[0]).toHaveTextContent("1");
    expect(ranks[1]).toHaveTextContent("2");

    const usernames = screen.getAllByTestId("entry-username");
    expect(usernames[0]).toHaveTextContent("speedster");
    expect(usernames[1]).toHaveTextContent("puzzler");

    const times = screen.getAllByTestId("entry-best-time");
    expect(times[0]).toHaveTextContent("1:35");
    expect(times[1]).toHaveTextContent("2:20");

    const counts = screen.getAllByTestId("entry-solve-count");
    expect(counts[0]).toHaveTextContent("12");
    expect(counts[1]).toHaveTextContent("5");
  });

  test("shows loading state", () => {
    mockIsLoading = true;
    render(<LeaderboardPage />);
    expect(screen.getByTestId("leaderboard-loading")).toBeInTheDocument();
  });

  test("shows empty state when no data", () => {
    mockData = { entries: [] };
    render(<LeaderboardPage />);
    expect(screen.getByTestId("leaderboard-empty")).toBeInTheDocument();
  });

  test("renders view toggle buttons", () => {
    render(<LeaderboardPage />);
    expect(screen.getByTestId("view-all-time")).toBeInTheDocument();
    expect(screen.getByTestId("view-this-week")).toBeInTheDocument();
  });

  test("renders friends filter checkbox", () => {
    render(<LeaderboardPage />);
    expect(screen.getByTestId("friends-filter")).toBeInTheDocument();
  });

  test("clicking difficulty tab updates selection", () => {
    render(<LeaderboardPage />);
    const hardTab = screen.getByTestId("tab-hard");
    fireEvent.click(hardTab);
    // The hard tab should now have the active styling (bg-orange-600)
    expect(hardTab.className).toContain("bg-orange-600");
  });
});
