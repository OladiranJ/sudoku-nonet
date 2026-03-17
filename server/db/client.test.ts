/**
 * @jest-environment node
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load .env.local — check cwd first, then walk up to find the repo root
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

import { createBrowserClient, createServerClient } from "./client";

describe("Supabase client setup", () => {
  describe("createBrowserClient", () => {
    test("initializes without error and returns a SupabaseClient", () => {
      const client = createBrowserClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe("function");
      expect(typeof client.auth).toBe("object");
    });
  });

  describe("createServerClient", () => {
    test("initializes without error and returns a SupabaseClient", () => {
      const client = createServerClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe("function");
      expect(typeof client.auth).toBe("object");
    });

    test("can reach Supabase (health check query)", async () => {
      const client = createServerClient();
      const { error } = await client.from("profiles").select("*").limit(0);
      expect(error).toBeNull();
    });
  });

  describe("missing environment variables", () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    test("createBrowserClient throws when env vars are missing", () => {
      process.env = { ...originalEnv };
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createBrowserClient()).toThrow(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    });

    test("createServerClient throws when env vars are missing", () => {
      process.env = { ...originalEnv };
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => createServerClient()).toThrow(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    });
  });
});
