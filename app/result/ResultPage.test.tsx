import { render } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useParams: () => ({ gameId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// --- Mock result data ---
const mockResult = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  difficulty: "hard",
  time_seconds: 245,
  error_count: 3,
  hint_count: 1,
  is_daily: true,
  puzzle_date: "2026-03-20",
  completed_at: "2026-03-20T14:30:00Z",
  username: "puzzlemaster",
  avatarUrl: null,
};

let mockResultError: { message: string } | null = null;
let mockResultLoading = false;
let mockResultData: typeof mockResult | undefined = mockResult;

jest.mock("@/lib/trpc/client", () => ({
  trpc: {
    result: {
      getResult: {
        useQuery: () => ({
          data: mockResultError || mockResultLoading ? undefined : mockResultData,
          isLoading: mockResultLoading,
          error: mockResultError,
        }),
      },
    },
  },
}));

import ResultPage from "@/app/result/[gameId]/page";

beforeEach(() => {
  mockResultError = null;
  mockResultLoading = false;
  mockResultData = mockResult;
});

describe("ResultPage", () => {
  it("renders game result for valid gameId", () => {
    const { container } = render(<ResultPage />);

    expect(container.querySelector('[data-testid="result-page"]')).not.toBeNull();
    expect(
      container.querySelector('[data-testid="result-username"]')!.textContent
    ).toBe("puzzlemaster");
  });

  it("displays correct stats (time, difficulty, errors, hints)", () => {
    const { container } = render(<ResultPage />);

    expect(
      container.querySelector('[data-testid="result-difficulty"]')!.textContent
    ).toBe("Hard");
    expect(
      container.querySelector('[data-testid="result-time"]')!.textContent
    ).toBe("4:05");
    expect(
      container.querySelector('[data-testid="result-errors"]')!.textContent
    ).toBe("3");
    expect(
      container.querySelector('[data-testid="result-hints"]')!.textContent
    ).toBe("1");
  });

  it("shows daily badge for daily puzzles", () => {
    const { container } = render(<ResultPage />);

    expect(
      container.querySelector('[data-testid="result-type-badge"]')!.textContent
    ).toBe("Daily");
  });

  it("shows random badge for random puzzles", () => {
    mockResultData = { ...mockResult, is_daily: false };

    const { container } = render(<ResultPage />);

    expect(
      container.querySelector('[data-testid="result-type-badge"]')!.textContent
    ).toBe("Random");
  });

  it("shows error/not-found state for invalid gameId", () => {
    mockResultError = { message: "Game not found" };
    mockResultData = undefined;

    const { container } = render(<ResultPage />);

    expect(
      container.querySelector('[data-testid="result-not-found"]')
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="result-page"]')).toBeNull();
  });

  it("renders copy link button", () => {
    const { container } = render(<ResultPage />);

    const copyBtn = container.querySelector(
      '[data-testid="copy-link-button"]'
    );
    expect(copyBtn).not.toBeNull();
    expect(copyBtn!.textContent).toBe("Copy Link");
  });

  it("copy button copies URL to clipboard", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const { container } = render(<ResultPage />);

    const copyBtn = container.querySelector(
      '[data-testid="copy-link-button"]'
    )!;
    copyBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // Wait for the async clipboard call
    await new Promise((r) => setTimeout(r, 10));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/result/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
    );
  });
});
