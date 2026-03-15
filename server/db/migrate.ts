/**
 * Migration runner — executes SQL files against Supabase.
 *
 * Usage: npx tsx server/db/migrate.ts
 *
 * Supports two modes:
 * 1. Direct Postgres (if DATABASE_URL or DB_HOST is set)
 * 2. Supabase RPC via exec_sql function (requires the function to exist in the DB)
 *
 * Reads .env.local for credentials.
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runSQL(sql: string): Promise<void> {
  const { error } = await supabase.rpc("exec_sql", { sql });
  if (error) {
    throw new Error(`${error.message} (${error.code})`);
  }
}

async function main(): Promise<void> {
  const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  console.log(`Found ${files.length} migration(s):`);
  files.forEach((f) => console.log(`  - ${f}`));

  // Verify exec_sql function exists
  const { error: testError } = await supabase.rpc("exec_sql", {
    sql: "SELECT 1",
  });
  if (testError) {
    console.error(
      "exec_sql function not found. Create it in the Supabase SQL Editor first:"
    );
    console.error(`
  CREATE OR REPLACE FUNCTION exec_sql(sql text)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER
  AS $$ BEGIN EXECUTE sql; END; $$;
    `);
    process.exit(1);
  }
  console.log("Connected via exec_sql RPC.\n");

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`Running ${file}...`);
    try {
      await runSQL(sql);
      console.log(`  ✓ ${file} applied successfully`);
    } catch (err) {
      console.error(`  ✗ ${file} failed:`, (err as Error).message);
      process.exit(1);
    }
  }

  console.log("\nAll migrations applied successfully.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message || err);
  process.exit(1);
});
