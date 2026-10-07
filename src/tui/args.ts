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
    t("Uso: tokenusage tui [opções]"),
    "",
    t("Dashboard de consumo de tokens no terminal."),
    "",
    t("Opções:"),
    option("--days <7|30|90>", t("Período inicial (padrão: 30)")),
    option(
      "--channel <tool|api>",
      t("Canal inicial: ferramentas ou API (padrão: tool)"),
    ),
    option(
      "--lang <pt-BR|en>",
      t("Idioma da interface (padrão: o das preferências da dashboard)"),
    ),
    option("--once", t("Imprime a visão geral uma vez e sai")),
    option("-h, --help", t("Mostra esta ajuda")),
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
      throw new Error(t("A opção {flag} precisa de um valor.", { flag }));
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
          throw new Error(t("Use --days com 7, 30 ou 90."));
        options.days = days;
      } else if (flag === "--channel") {
        if (raw !== "tool" && raw !== "api")
          throw new Error(t("Use --channel com tool ou api."));
        options.channel = raw;
      } else {
        if (!(LANGUAGE_CODES as readonly string[]).includes(raw))
          throw new Error(
            t("Use --lang com um destes códigos: {codes}.", {
              codes: LANGUAGE_CODES.join(", "),
            }),
          );
        options.lang = raw as Language;
      }
    } else
      throw new Error(
        t("Opção desconhecida: {option}", { option: argv[index] }),
      );
  }
  return options;
}
