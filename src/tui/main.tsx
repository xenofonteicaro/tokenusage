import { render, renderToString } from "ink";
import { buildUsagePayload } from "../lib/usage-snapshot";
import { App } from "./app";
import { HELP_TEXT, parseArgs, type TuiOptions } from "./args";
import { OnceView } from "./once";

async function main() {
  let options: TuiOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("Use tokenusage tui --help para ver as opções.");
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }
  if (options.once) {
    const snapshot = await buildUsagePayload();
    console.log(
      renderToString(
        <OnceView
          snapshot={snapshot}
          options={options}
          columns={process.stdout.columns || 100}
          rows={40}
        />,
        { columns: process.stdout.columns || 100 },
      ),
    );
    return;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(
      "A TUI precisa de um terminal interativo. Use --once para uma saída estática.",
    );
    process.exitCode = 1;
    return;
  }
  const instance = render(<App options={options} />, { alternateScreen: true });
  await instance.waitUntilExit();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
