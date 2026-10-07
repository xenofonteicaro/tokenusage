import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LANGUAGE_CODES } from "../src/lib/i18n/languages";
import { messages } from "../src/lib/i18n/messages";
import { createI18n } from "../src/lib/i18n/translate";
import { exportCSV } from "../src/lib/analytics";
import {
  parseImport,
  mergeImports,
  upgradeLegacyLabels,
} from "../src/lib/import-usage";
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

async function withDataDirectory<T>(
  work: (directory: string) => Promise<T>,
): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "tokenusage-emitted-"));
  const previousData = process.env.TOKENUSAGE_DATA_DIR;
  const previousProfile = process.env.TOKENUSAGE_PROFILE_DIR;
  process.env.TOKENUSAGE_DATA_DIR = directory;
  process.env.TOKENUSAGE_PROFILE_DIR = join(directory, "profile");
  try {
    return await work(directory);
  } finally {
    if (previousData === undefined) delete process.env.TOKENUSAGE_DATA_DIR;
    else process.env.TOKENUSAGE_DATA_DIR = previousData;
    if (previousProfile === undefined)
      delete process.env.TOKENUSAGE_PROFILE_DIR;
    else process.env.TOKENUSAGE_PROFILE_DIR = previousProfile;
    await rm(directory, { recursive: true, force: true });
  }
}

test("every English message emitted by the API routes has a dictionary entry", async () => {
  const routes = join(process.cwd(), "src", "app", "api");
  const emitted = new Set<string>();
  for (const entry of await readdir(routes, { recursive: true })) {
    if (!entry.endsWith("route.ts")) continue;
    const source = await readFile(join(routes, entry), "utf8");
    for (const match of source.matchAll(
      /error(?: instanceof Error \? error\.message)?\s*:\s*"([^"]+)"/g,
    ))
      emitted.add(match[1]);
    for (const match of source.matchAll(/new Error\(\s*"([^"]+)"/g))
      emitted.add(match[1]);
  }
  assert.ok(emitted.size > 5);
  const missing = [...emitted].filter(
    (message) => !Object.hasOwn(messages.en, message),
  );
  assert.deepEqual(missing, []);
});

test("source cards returned by /api/usage translate for every language", async () => {
  await withDataDirectory(async () => {
    const { GET } = await import("../src/app/api/usage/route");
    const response = await GET(
      new Request("http://127.0.0.1:3000/api/usage", {
        headers: { Host: "127.0.0.1:3000" },
      }),
    );
    const body = (await response.json()) as {
      sources: { id: string; name: string; detail: string }[];
    };
    assert.ok(body.sources.length > 0);
    for (const source of body.sources) {
      // Locations are filesystem paths and pass through t() unchanged.
      for (const text of [source.name, source.detail]) {
        const probe = text.replace(
          /^[a-z]+ · API logs$/,
          "{provider} · API logs",
        );
        assert.ok(
          Object.hasOwn(messages.en, probe),
          `missing dictionary entry: ${text}`,
        );
      }
    }
    const apiCard = body.sources.find((source) => source.id === "codex-api")!;
    assert.equal(createI18n("pt-BR").t(apiCard.name), "codex · logs de API");
  });
});

test("reserved fallback labels translate at display while user names stay untouched", () => {
  const portuguese = createI18n("pt-BR");
  assert.equal(portuguese.label("No project"), "Sem projeto");
  assert.equal(portuguese.label("Model not provided"), "Modelo não informado");
  assert.equal(portuguese.label("Imported API"), "API importada");
  assert.equal(portuguese.label("Project 1a2b3c4d"), "Projeto 1a2b3c4d");
  assert.equal(portuguese.label("Project Atlas"), "Project Atlas");
  assert.equal(portuguese.label("my-service"), "my-service");
  assert.equal(createI18n("en").label("No project"), "No project");
  assert.equal(createI18n("fr").label("Imported API"), "API importée");
});

test("rows saved with Portuguese fallback labels are relabeled without changing IDs", () => {
  const base = parseImport(
    JSON.stringify({
      provider: "grok",
      timestamp: "2026-10-07T12:00:00Z",
      model: "test",
      usage: { prompt_tokens: 10, completion_tokens: 2 },
    }),
  )[0];
  const upgraded = upgradeLegacyLabels([
    { ...base, project: "API importada", model: "Modelo não informado" },
    { ...base, id: "b", project: "Sem projeto" },
    { ...base, id: "c", project: "Projeto 1a2b3c4d" },
    { ...base, id: "d", project: "Projeto Atlas", model: "gpt-4o" },
  ]);
  assert.deepEqual(
    upgraded.map((row) => [row.id, row.project, row.model]),
    [
      [base.id, "Imported API", "Model not provided"],
      ["b", "No project", "test"],
      ["c", "Project 1a2b3c4d", "test"],
      ["d", "Projeto Atlas", "gpt-4o"],
    ],
  );
});
