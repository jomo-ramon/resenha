import { defineConfig, devices } from "@playwright/test";

const isCi = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  // `workers` is conditionally added to satisfy `exactOptionalPropertyTypes`.
  ...(isCi ? { workers: 1 } : {}),
  reporter: isCi ? [["github"], ["html"]] : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
