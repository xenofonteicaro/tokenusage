import test from "node:test";
import assert from "node:assert/strict";
import { helpText, parseArgs } from "../../src/tui/args";
import { createTuiI18n } from "../../src/tui/i18n";

test("defaults", () => {
  assert.deepEqual(parseArgs([]), {
    once: false,
    help: false,
    days: 30,
    channel: "tool",
  });
});

test("parses flags with spaces and equals signs", () => {
  assert.deepEqual(parseArgs(["--once", "--days", "7", "--channel=api"]), {
    once: true,
    help: false,
    days: 7,
    channel: "api",
  });
  assert.equal(parseArgs(["-h"]).help, true);
  assert.equal(parseArgs(["--days=90"]).days, 90);
});

test("rejects invalid input with English messages by default", () => {
  assert.throws(() => parseArgs(["--days", "15"]), /7, 30 or 90/);
  assert.throws(() => parseArgs(["--days"]), /needs a value/);
  assert.throws(() => parseArgs(["--channel", "web"]), /tool or api/);
  assert.throws(() => parseArgs(["--nope"]), /Unknown option: --nope/);
});

test("--lang selects the interface language and rejects unknown codes", () => {
  assert.equal(parseArgs(["--lang", "en"]).lang, "en");
  assert.equal(parseArgs(["--lang=pt-BR"]).lang, "pt-BR");
  assert.equal(parseArgs([]).lang, undefined);
  assert.throws(() => parseArgs(["--lang", "xx"]), /--lang/);
});

test("messages and help follow the chosen language", () => {
  const { t } = createTuiI18n("pt-BR");
  assert.throws(
    () => parseArgs(["--days", "15"], t),
    /Use --days com 7, 30 ou 90/,
  );
  assert.throws(() => parseArgs(["--nope"], t), /Opção desconhecida: --nope/);
  assert.match(helpText(t), /Uso: tokenusage tui/);
  assert.match(helpText(createTuiI18n("en").t), /Usage: tokenusage tui/);
});
