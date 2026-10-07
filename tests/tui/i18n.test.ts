import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { messages } from "../../src/lib/i18n/messages";
import { createTuiI18n, resolveTuiLanguage } from "../../src/tui/i18n";
import { tuiMessagesPt } from "../../src/tui/messages";

test("only Portuguese is translated; every other language shows the English source", () => {
  assert.equal(resolveTuiLanguage("pt-BR"), "pt-BR");
  assert.equal(resolveTuiLanguage("en"), "en");
  // No half-translated screens: other web languages show English as a whole.
  for (const other of ["es", "it", "fr", "zh-CN", "xx", undefined, 3])
    assert.equal(resolveTuiLanguage(other), "en");
});

test("English is the source language and Portuguese translates it", () => {
  const en = createTuiI18n("en");
  const pt = createTuiI18n("pt-BR");
  assert.equal(en.t("Overview"), "Overview");
  assert.equal(pt.t("Overview"), "Visão geral");
  assert.equal(en.t("Updated {time}", { time: "12:00" }), "Updated 12:00");
  assert.equal(pt.t("Updated {time}", { time: "12:00" }), "Atualizado 12:00");
  assert.equal(pt.t("text with no translation"), "text with no translation");
});

test("plurals pick one or many in each language", () => {
  const en = createTuiI18n("en");
  const pt = createTuiI18n("pt-BR");
  assert.equal(en.tn(1, "model", "models"), "1 model");
  assert.equal(en.tn(3, "model", "models"), "3 models");
  assert.equal(pt.tn(1, "model", "models"), "1 modelo");
  assert.equal(pt.tn(0, "model", "models"), "0 modelos");
});

test("numbers follow the language and diagnostics reuse the web translations", () => {
  assert.equal(createTuiI18n("en").formatNumber(1234.5), "1,234.5");
  assert.equal(createTuiI18n("pt-BR").formatNumber(1234.5), "1.234,5");
  const diagnostic =
    "Import logs with counters returned by the API. No admin key required.";
  assert.equal(
    createTuiI18n("pt-BR").t(diagnostic),
    messages["pt-BR"][diagnostic],
  );
  assert.equal(createTuiI18n("en").t(diagnostic), diagnostic);
});

test("percentages use the decimal separator of each language", () => {
  assert.equal(createTuiI18n("pt-BR").percent(0.1234), "12,3%");
  assert.equal(createTuiI18n("en").percent(0.1234), "12.3%");
  assert.equal(createTuiI18n("en").percent(0.5, 0), "50%");
});

test("plurals can format large counts with the language separators", () => {
  const en = createTuiI18n("en");
  assert.equal(en.tn(1234, "file", "files", en.formatNumber), "1,234 files");
  assert.equal(en.tn(1, "file", "files", en.formatNumber), "1 file");
});

// Every literal passed to t()/tn() in src/tui must have a Portuguese entry.
function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

test("every literal translation key used by the TUI has a Portuguese translation", () => {
  const root = resolve(import.meta.dirname, "../../src/tui");
  const literal = String.raw`"((?:[^"\\]|\\.)*)"`;
  const single = new RegExp(String.raw`\bt\(\s*${literal}`, "g");
  const plural = new RegExp(
    String.raw`\btn\(\s*[^,]+,\s*${literal}\s*,\s*${literal}`,
    "g",
  );
  const used = new Set<string>();
  for (const file of sources(root)) {
    const code = readFileSync(file, "utf8");
    for (const match of code.matchAll(single)) used.add(match[1]);
    for (const match of code.matchAll(plural)) {
      used.add(match[1]);
      used.add(match[2]);
    }
  }
  assert.ok(used.size > 20, `only found ${used.size} keys`);
  const missing = [...used].filter((key) => !(key in tuiMessagesPt));
  assert.deepEqual(missing, []);
});
