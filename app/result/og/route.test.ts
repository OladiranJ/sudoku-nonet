/**
 * @jest-environment node
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load .env.local — walk up to find repo root
function findEnvLocal(): string {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, ".env.local");
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  return path.resolve(process.cwd(), ".env.local");
}

dotenv.config({ path: findEnvLocal() });

import { createClient } from "@supabase/supabase-js";
import { GET } from "@/app/result/[gameId]/og/route";
import { generateMetadata } from "@/app/result/[gameId]/layout";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client — bypasses RLS for setup/teardown
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

jest.setTimeout(15000);

describe("OG image route and metadata", () => {
  let testUserId: string;
  let testGameId: string;

  beforeAll(async () => {
    // Create a test user
    const { data, error } = await admin.auth.admin.createUser({
      email: "test-og-image@nonet-test.local",
      password: "test-password-og-123!",
      email_confirm: true,
    });
    if (error) throw new Error(`Failed to create test user: ${error.message}`);
    testUserId = data.user.id;

    await admin
      .from("profiles")
      .insert({ id: testUserId, username: "og_test_user" });

    // Insert a test game
    const { data: gameData, error: gameErr } = await admin
      .from("games")
      .insert({
        user_id: testUserId,
        puzzle_seed: "og-test-seed",
        difficulty: "expert",
        time_seconds: 580,
        error_count: 1,
        hint_count: 2,
        is_daily: false,
      })
      .select()
      .single();
    if (gameErr)
      throw new Error(`Failed to create test game: ${gameErr.message}`);
    testGameId = gameData.id;
  });

  afterAll(async () => {
    await admin.from("games").delete().eq("id", testGameId);
    await admin.from("profiles").delete().eq("id", testUserId);
    await admin.auth.admin.deleteUser(testUserId);
  });

  test("OG route returns an image with content-type image/png", async () => {
    const request = new Request(
      `http://localhost:3000/result/${testGameId}/og`
    );
    const response = await GET(request, {
      params: Promise.resolve({ gameId: testGameId }),
    });

    expect(response.status).toBe(200);
    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("image/png");
  });

  test("OG route returns 404 for invalid gameId", async () => {
    const request = new Request(
      "http://localhost:3000/result/00000000-0000-0000-0000-000000000000/og"
    );
    const response = await GET(request, {
      params: Promise.resolve({
        gameId: "00000000-0000-0000-0000-000000000000",
      }),
    });

    expect(response.status).toBe(404);
  });

  test("Meta tags are present with correct game stats", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ gameId: testGameId }),
    });

    expect(metadata.title).toContain("og_test_user");
    expect(metadata.title).toContain("Expert");
    expect(metadata.title).toContain("9:40");
    expect(metadata.description).toContain("Errors: 1");
    expect(metadata.description).toContain("Hints: 2");
    expect(metadata.description).toContain("Random");

    // Check OG image URL
    const ogImages = (metadata.openGraph as { images?: { url: string }[] })
      ?.images;
    expect(ogImages).toBeDefined();
    expect(ogImages![0].url).toContain(`/result/${testGameId}/og`);

    // Check twitter card
    expect((metadata.twitter as { card?: string })?.card).toBe(
      "summary_large_image"
    );
  });

  test("Meta tags handle missing game gracefully", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        gameId: "00000000-0000-0000-0000-000000000000",
      }),
    });

    expect(metadata.title).toContain("Not Found");
  });
});
