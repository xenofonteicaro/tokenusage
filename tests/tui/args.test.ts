import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../../src/tui/args";

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

test("rejects invalid input in Portuguese", () => {
  assert.throws(() => parseArgs(["--days", "15"]), /7, 30 ou 90/);
  assert.throws(() => parseArgs(["--days"]), /precisa de um valor/);
  assert.throws(() => parseArgs(["--channel", "web"]), /tool ou api/);
  assert.throws(() => parseArgs(["--nope"]), /Opção desconhecida: --nope/);
});
