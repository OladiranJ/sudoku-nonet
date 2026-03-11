import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";

const dir = path.join(process.cwd(), "temporary screenshots");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Find next available screenshot number
const existing = fs.readdirSync(dir).filter((f) => f.startsWith("screenshot-"));
let maxNum = 0;
for (const f of existing) {
  const match = f.match(/^screenshot-(\d+)/);
  if (match) {
    maxNum = Math.max(maxNum, parseInt(match[1], 10));
  }
}
const num = maxNum + 1;
const suffix = label ? `-${label}` : "";
const filename = `screenshot-${num}${suffix}.png`;
const filepath = path.join(dir, filename);

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
  await page.screenshot({ path: filepath, fullPage: true });
  await browser.close();
  console.log(`Screenshot saved: ${filepath}`);
}

main().catch((err) => {
  console.error("Screenshot failed:", err.message);
  process.exit(1);
});
