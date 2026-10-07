import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  readSettings,
  settingsSchema,
  writeJson,
} from "../src/lib/local-store";
import { defaultSettings } from "../src/lib/types";

test("settings validates positive exchange rates and nonnegative model prices", () => {
  for (const usdToBrlRate of [0, -1, Infinity, NaN]) {
    assert.equal(
      settingsSchema.safeParse({ ...defaultSettings, usdToBrlRate }).success,
      false,
    );
  }
  assert.equal(
    settingsSchema.safeParse({
      ...defaultSettings,
      customPricing: {
        test: { inputPer1M: -1, outputPer1M: 1, cacheReadPer1M: 0 },
      },
    }).success,
    false,
  );
  const legacy = settingsSchema.parse({
    monthlyTokenGoal: null,
    subscriptions: defaultSettings.subscriptions,
  });
  assert.equal(legacy.usdToBrlRate, 5.75);
  assert.deepEqual(legacy.customPricing, {});
});

test("settings persist custom tariffs and recover invalid stored exchange rate", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "tokenusage-settings-"),
  );
  const original = process.env.TOKENUSAGE_DATA_DIR;
  process.env.TOKENUSAGE_DATA_DIR = directory;
  try {
    const settings = {
      ...defaultSettings,
      usdToBrlRate: 6,
      customPricing: {
        test: { inputPer1M: 4, outputPer1M: 10, cacheReadPer1M: 1 },
      },
    };
    await writeJson("settings.json", settings);
    assert.deepEqual(await readSettings(), settings);
    const { GET } = await import("../src/app/api/settings/route");
    const response = await GET(
      new Request("http://127.0.0.1:3000/api/settings", {
        headers: { host: "127.0.0.1:3000" },
      }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).settings, settings);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    const foreign = await GET(
      new Request("http://evil.example/api/settings", {
        headers: { host: "evil.example" },
      }),
    );
    assert.equal(foreign.status, 403);
    await writeJson("settings.json", { ...settings, usdToBrlRate: 0 });
    const recovered = await readSettings();
    assert.equal(recovered.usdToBrlRate, 5.75);
    assert.deepEqual(recovered.customPricing, settings.customPricing);
  } finally {
    if (original === undefined) delete process.env.TOKENUSAGE_DATA_DIR;
    else process.env.TOKENUSAGE_DATA_DIR = original;
    await rm(directory, { recursive: true, force: true });
  }
});
