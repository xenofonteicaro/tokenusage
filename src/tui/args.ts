import { LANGUAGE_CODES, type Language } from "../lib/i18n/languages";
import type { Channel } from "../lib/types";
import type { Translate } from "./i18n";

export const PERIODS = [7, 30, 90] as const;

export interface TuiOptions {
  once: boolean;
  help: boolean;
  days: number;
  channel: Channel;
  lang?: Language;
}

export function helpText(t: Translate): string {
  const option = (flag: string, description: string) =>
    `  ${flag.padEnd(22)}${description}`;
  return [
    t("Usage: tokenusage tui [options]"),
    "",
    t("Token usage dashboard in the terminal."),
    "",
    t("Options:"),
    option("--days <7|30|90>", t("Initial period (default: 30)")),
    option(
      "--channel <tool|api>",
      t("Initial channel: tools or API (default: tool)"),
    ),
    option(
      "--lang <pt-BR|en>",
      t("Interface language (default: the dashboard preference)"),
    ),
    option("--once", t("Print the overview once and exit")),
    option("-h, --help", t("Show this help")),
  ].join("\n");
}

// Reads --lang ahead of parseArgs so even argument errors come out translated.
export function languageFromArgs(argv: string[]): string | undefined {
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === "--lang") return argv[index + 1];
    if (argv[index].startsWith("--lang=")) return argv[index].slice(7);
  }
  return undefined;
}

export function parseArgs(
  argv: string[],
  t: Translate = (message, values = {}) =>
    message.replace(/\{(\w+)\}/g, (token, name: string) =>
      Object.hasOwn(values, name) ? String(values[name]) : token,
    ),
): TuiOptions {
  const options: TuiOptions = {
    once: false,
    help: false,
    days: 30,
    channel: "tool",
  };
  const value = (flag: string, inline: string | undefined, next?: string) => {
    const result = inline ?? next;
    if (result === undefined || result.startsWith("--"))
      throw new Error(t("The {flag} option needs a value.", { flag }));
    return result;
  };
  for (let index = 0; index < argv.length; index++) {
    const equals = argv[index].indexOf("=");
    const flag = equals < 0 ? argv[index] : argv[index].slice(0, equals);
    const inline = equals < 0 ? undefined : argv[index].slice(equals + 1);
    if (flag === "--once") options.once = true;
    else if (flag === "--help" || flag === "-h") options.help = true;
    else if (flag === "--days" || flag === "--channel" || flag === "--lang") {
      const raw = value(flag, inline, argv[index + 1]);
      if (inline === undefined) index++;
      if (flag === "--days") {
        const days = Number(raw);
        if (!(PERIODS as readonly number[]).includes(days))
          throw new Error(t("Use --days with 7, 30 or 90."));
        options.days = days;
      } else if (flag === "--channel") {
        if (raw !== "tool" && raw !== "api")
          throw new Error(t("Use --channel with tool or api."));
        options.channel = raw;
      } else {
        if (!(LANGUAGE_CODES as readonly string[]).includes(raw))
          throw new Error(
            t("Use --lang with one of: {codes}.", {
              codes: LANGUAGE_CODES.join(", "),
            }),
          );
        options.lang = raw as Language;
      }
    } else
      throw new Error(t("Unknown option: {option}", { option: argv[index] }));
  }
  return options;
}
