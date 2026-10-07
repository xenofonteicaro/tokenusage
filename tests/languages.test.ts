import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LANGUAGE_CODES } from "../src/lib/i18n/languages";
import { messages } from "../src/lib/i18n/messages";
import { createI18n } from "../src/lib/i18n/translate";
import { exportCSV } from "../src/lib/analytics";
import { parseImport, mergeImports } from "../src/lib/import-usage";
import {
  settingsSchema,
  writeJson,
  readSettings,
} from "../src/lib/local-store";
import { defaultSettings } from "../src/lib/types";

test("all translations retain the same messages and interpolation values", () => {
  const reference = Object.keys(messages.en).sort();
  const variables = (text: string) =>
    [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const dictionary of Object.values(messages)) {
    assert.deepEqual(Object.keys(dictionary).sort(), reference);
    for (const [source, translated] of Object.entries(dictionary)) {
      assert.ok(translated.trim());
      assert.deepEqual(variables(translated), variables(source));
    }
  }
  const chinese = createI18n("zh-CN");
  assert.equal(
    chinese.t("{input} input + {output} output", { input: 120, output: 30 }),
    "输入 120 + 输出 30",
  );
  assert.equal(
    createI18n("en").t("Record 2: counters must be nonnegative integers."),
    "Record 2: counters must be nonnegative integers.",
  );
  assert.equal(
    createI18n("fr").t("project-provided-name"),
    "project-provided-name",
  );
  assert.equal(
    createI18n("pt-BR").t("Record 2: counters must be nonnegative integers."),
    "Registro 2: contadores devem ser inteiros não negativos.",
  );
});

test("CSV headers use stable English field names", () => {
  const headers = exportCSV([])
    .replace(/^\uFEFF/, "")
    .split(";");
  assert.deepEqual(headers, [
    '"timestamp_utc"',
    '"provider"',
    '"channel"',
    '"model"',
    '"project"',
    '"input_tokens"',
    '"output_tokens"',
    '"cached_tokens"',
    '"cache_write_tokens"',
    '"reasoning_tokens"',
    '"total_tokens"',
    '"reported_cost_usd"',
  ]);
});

test("English source labels preserve pre-existing IDs for imports without a project or request ID", () => {
  const rows = parseImport(
    JSON.stringify({
      provider: "grok",
      timestamp: "2026-10-07T12:00:00Z",
      model: "test",
      usage: { prompt_tokens: 10, completion_tokens: 2 },
    }),
  );
  // Golden ID from the released 0.2.0 importer, before English source labels.
  assert.equal(rows[0].id, "9059205c820f7c75953dc4ac");
  assert.equal(
    mergeImports([{ ...rows[0], project: "previous-display-label" }], rows)
      .length,
    1,
  );
});

test("locale changes presentation while retaining BRL currency and Sao Paulo dates", () => {
  assert.equal(createI18n("pt-BR").formatNumber(1234.5), "1.234,5");
  assert.equal(createI18n("en").formatNumber(1234.5), "1,234.5");
  assert.match(createI18n("zh-CN").formatBRL(1234), /R\$|BRL/);
  assert.match(createI18n("en").formatDate("2026-10-07T01:00:00Z"), /06/);
  assert.equal(createI18n("unsupported").language, "pt-BR");
  const legacy = { ...defaultSettings };
  delete legacy.language;
  assert.equal(settingsSchema.parse(legacy).language, "pt-BR");
  assert.equal(
    settingsSchema.safeParse({ ...legacy, language: "xx" }).success,
    false,
  );
});

test("settings API persists every supported language and rejects invalid choices without losing saved preferences", async () => {
  const directory = await mkdtemp(join(tmpdir(), "tokenusage-languages-"));
  const previous = process.env.TOKENUSAGE_DATA_DIR;
  process.env.TOKENUSAGE_DATA_DIR = directory;
  try {
    const { PUT } = await import("../src/app/api/settings/route");
    for (const language of LANGUAGE_CODES) {
      const settings = {
        ...defaultSettings,
        language,
        monthlyTokenGoal: 123456,
        usdToBrlRate: 6,
      };
      const response = await PUT(
        new Request("http://127.0.0.1:3000/api/settings", {
          method: "PUT",
          headers: { Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" },
          body: JSON.stringify(settings),
        }),
      );
      assert.equal(response.status, 200);
      assert.deepEqual(await readSettings(), settings);
    }
    const response = await PUT(
      new Request("http://127.0.0.1:3000/api/settings", {
        method: "PUT",
        headers: { Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" },
        body: JSON.stringify({ ...defaultSettings, language: "xx" }),
      }),
    );
    assert.equal(response.status, 400);
    assert.equal((await readSettings()).language, "zh-CN");
    await writeJson("settings.json", defaultSettings);
  } finally {
    if (previous === undefined) delete process.env.TOKENUSAGE_DATA_DIR;
    else process.env.TOKENUSAGE_DATA_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});
