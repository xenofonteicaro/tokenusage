import { defineConfig } from "@playwright/test";
import path from "node:path";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  use: { baseURL: "http://127.0.0.1:3101", trace: "retain-on-failure" },
  webServer: {
    command:
      "npx tsx scripts/prepare-test-profile.ts && npm run start -- --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    env: {
      TOKENUSAGE_PROFILE_DIR: path.resolve(".test-profile"),
      TOKENUSAGE_DATA_DIR: path.resolve(".test-data"),
    },
    timeout: 60000,
  },
});
