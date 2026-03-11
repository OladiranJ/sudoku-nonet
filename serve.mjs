import { spawn } from "child_process";
import http from "http";

const PORT = 3000;

// Check if port is already in use
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => {
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const inUse = await checkPort(PORT);
  if (inUse) {
    console.log(`Server already running on http://localhost:${PORT}`);
    process.exit(0);
  }

  console.log(`Starting Next.js dev server on http://localhost:${PORT}...`);
  const child = spawn("npx", ["next", "dev", "--port", String(PORT)], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });

  child.on("error", (err) => {
    console.error("Failed to start dev server:", err.message);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main();
