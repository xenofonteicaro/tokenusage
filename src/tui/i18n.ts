import { createI18n } from "../lib/i18n/translate";
import { shortDate } from "./format";
import { tuiMessagesEn } from "./messages";

// The TUI ships complete dictionaries for Portuguese (the source language of
// every message) and English. Any other web language falls back to Portuguese
// as a whole instead of mixing languages on one screen.
export type TuiLanguage = "pt-BR" | "en";

export function resolveTuiLanguage(value: unknown): TuiLanguage {
  return value === "en" ? "en" : "pt-BR";
}

export type Translate = (
  message: string,
  values?: Record<string, string | number>,
) => string;

const interpolate = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (token, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : token,
  );

export function createTuiI18n(value: unknown) {
  const language = resolveTuiLanguage(value);
  // Shared with the web: number/date formats and the diagnostics that
  // src/lib collectors write in Portuguese.
  const web = createI18n(language);
  const t: Translate = (message, values = {}) =>
    language === "en" && Object.hasOwn(tuiMessagesEn, message)
      ? interpolate(tuiMessagesEn[message], values)
      : web.t(message, values);
  return {
    language,
    t,
    tn: (
      count: number,
      one: string,
      many: string,
      format: (value: number) => string = String,
    ) => `${format(count)} ${t(count === 1 ? one : many)}`,
    shortDate: (day: string) => shortDate(day, language),
    formatTokens: web.formatTokens,
    formatNumber: web.formatNumber,
    formatUSD: web.formatUSD,
    formatBRL: web.formatBRL,
    formatDate: web.formatDate,
    formatTime: web.formatTime,
    formatDecimal: web.formatDecimal,
    percent: (fraction: number, digits = 1) =>
      `${web.formatDecimal(fraction * 100, digits)}%`,
  };
}

export type TuiI18n = ReturnType<typeof createTuiI18n>;
