import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { messages } from "../../src/lib/i18n/messages";
import { createTuiI18n, resolveTuiLanguage } from "../../src/tui/i18n";
import { tuiMessagesEn } from "../../src/tui/messages";

test("only English and Portuguese have a complete TUI dictionary", () => {
  assert.equal(resolveTuiLanguage("en"), "en");
  assert.equal(resolveTuiLanguage("pt-BR"), "pt-BR");
  // No half-translated screens: unsupported languages stay in Portuguese.
  for (const other of ["es", "it", "fr", "zh-CN", "xx", undefined, 3])
    assert.equal(resolveTuiLanguage(other), "pt-BR");
});

test("translates with interpolation and keeps Portuguese as the source", () => {
  const en = createTuiI18n("en");
  const pt = createTuiI18n("pt-BR");
  assert.equal(en.t("Visão geral"), "Overview");
  assert.equal(pt.t("Visão geral"), "Visão geral");
  assert.equal(en.t("Atualizado {time}", { time: "12:00" }), "Updated 12:00");
  assert.equal(
    pt.t("Atualizado {time}", { time: "12:00" }),
    "Atualizado 12:00",
  );
  assert.equal(en.t("texto sem tradução"), "texto sem tradução");
});

test("plurals pick one or many in each language", () => {
  const en = createTuiI18n("en");
  const pt = createTuiI18n("pt-BR");
  assert.equal(en.tn(1, "modelo", "modelos"), "1 model");
  assert.equal(en.tn(3, "modelo", "modelos"), "3 models");
  assert.equal(pt.tn(1, "modelo", "modelos"), "1 modelo");
  assert.equal(pt.tn(0, "modelo", "modelos"), "0 modelos");
});

test("numbers follow the language and diagnostics reuse the web translations", () => {
  assert.equal(createTuiI18n("en").formatNumber(1234.5), "1,234.5");
  assert.equal(createTuiI18n("pt-BR").formatNumber(1234.5), "1.234,5");
  const diagnostic =
    "Importe logs com os contadores retornados pela API. Não requer chave administrativa.";
  assert.equal(createTuiI18n("en").t(diagnostic), messages.en[diagnostic]);
  assert.equal(createTuiI18n("pt-BR").t(diagnostic), diagnostic);
});

test("percentages use the decimal separator of each language", () => {
  assert.equal(createTuiI18n("pt-BR").percent(0.1234), "12,3%");
  assert.equal(createTuiI18n("en").percent(0.1234), "12.3%");
  assert.equal(createTuiI18n("en").percent(0.5, 0), "50%");
});

test("plurals can format large counts with the language separators", () => {
  const en = createTuiI18n("en");
  assert.equal(
    en.tn(1234, "arquivo", "arquivos", en.formatNumber),
    "1,234 files",
  );
  assert.equal(en.tn(1, "arquivo", "arquivos", en.formatNumber), "1 file");
});

// Every literal passed to t()/tn() in src/tui must have an English entry.
function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

test("every literal translation key used by the TUI exists in English", () => {
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
  const missing = [...used].filter((key) => !(key in tuiMessagesEn));
  assert.deepEqual(missing, []);
});
