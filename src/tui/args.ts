import type { Channel } from "../lib/types";

export const PERIODS = [7, 30, 90] as const;

export interface TuiOptions {
  once: boolean;
  help: boolean;
  days: number;
  channel: Channel;
}

export const HELP_TEXT = `Uso: tokenusage tui [opções]

Dashboard de consumo de tokens no terminal.

Opções:
  --days <7|30|90>        Período inicial (padrão: 30)
  --channel <tool|api>    Canal inicial: ferramentas ou API (padrão: tool)
  --once                  Imprime a visão geral uma vez e sai
  -h, --help              Mostra esta ajuda`;

export function parseArgs(argv: string[]): TuiOptions {
  const options: TuiOptions = {
    once: false,
    help: false,
    days: 30,
    channel: "tool",
  };
  const value = (flag: string, inline: string | undefined, next?: string) => {
    const result = inline ?? next;
    if (result === undefined || result.startsWith("--"))
      throw new Error(`A opção ${flag} precisa de um valor.`);
    return result;
  };
  for (let index = 0; index < argv.length; index++) {
    const equals = argv[index].indexOf("=");
    const flag = equals < 0 ? argv[index] : argv[index].slice(0, equals);
    const inline = equals < 0 ? undefined : argv[index].slice(equals + 1);
    if (flag === "--once") options.once = true;
    else if (flag === "--help" || flag === "-h") options.help = true;
    else if (flag === "--days" || flag === "--channel") {
      const raw = value(flag, inline, argv[index + 1]);
      if (inline === undefined) index++;
      if (flag === "--days") {
        const days = Number(raw);
        if (!(PERIODS as readonly number[]).includes(days))
          throw new Error("Use --days com 7, 30 ou 90.");
        options.days = days;
      } else {
        if (raw !== "tool" && raw !== "api")
          throw new Error("Use --channel com tool ou api.");
        options.channel = raw;
      }
    } else throw new Error(`Opção desconhecida: ${argv[index]}`);
  }
  return options;
}
