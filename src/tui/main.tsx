import { render, renderToString } from "ink";
import { readSettings } from "../lib/local-store";
import { buildUsagePayload } from "../lib/usage-snapshot";
import { App } from "./app";
import { helpText, languageFromArgs, parseArgs, type TuiOptions } from "./args";
import { createTuiI18n } from "./i18n";
import { OnceView } from "./once";

async function main() {
  const argv = process.argv.slice(2);
  // The language saved in the web preferences; a broken file just means the
  // default language.
  const saved = await readSettings()
    .then((settings) => settings.language)
    .catch(() => undefined);
  let options: TuiOptions;
  try {
    options = parseArgs(argv, createTuiI18n(languageFromArgs(argv) ?? saved).t);
  } catch (error) {
    const { t } = createTuiI18n(languageFromArgs(argv) ?? saved);
    console.error(error instanceof Error ? error.message : String(error));
    console.error(t("Use tokenusage tui --help to see the options."));
    process.exitCode = 2;
    return;
  }
  const i18n = createTuiI18n(options.lang ?? saved);
  if (options.help) {
    console.log(helpText(i18n.t));
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
      i18n.t(
        "The TUI needs an interactive terminal. Use --once for static output.",
      ),
    );
    process.exitCode = 1;
    return;
  }
  const instance = render(<App options={options} initialLanguage={saved} />, {
    alternateScreen: true,
  });
  await instance.waitUntilExit();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
