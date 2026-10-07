import { messages } from "./messages";
import { resolveLanguage } from "./languages";
import * as analytics from "../analytics";

export function createI18n(value: unknown) {
  const language = resolveLanguage(value);
  const dictionary: Readonly<Record<string, string>> = messages[language];
  const templates = Object.keys(dictionary)
    .filter((key) => key.includes("{"))
    .map((key) => {
      const names: string[] = [];
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = escaped.replace(/\\\{(\w+)\\\}/g, (_, name: string) => {
        names.push(name);
        return "(.+?)";
      });
      return { key, names, pattern: new RegExp(`^${pattern}$`) };
    });
  const t = (message: string, values: Record<string, string | number> = {}) => {
    const key = message.replace(/\s+/g, " ").trim();
    let translated = dictionary[key] ?? message;
    // The local API returns English diagnostic text. Match its known
    // message templates without altering user-provided project/model values.
    if (!Object.hasOwn(dictionary, key)) {
      for (const template of templates) {
        const match = template.pattern.exec(key);
        if (!match) continue;
        translated = dictionary[template.key];
        values = {
          ...Object.fromEntries(
            template.names.map((name, i) => [name, match[i + 1]]),
          ),
          ...values,
        };
        break;
      }
    }
    return translated.replace(/\{(\w+)\}/g, (token, name: string) =>
      Object.hasOwn(values, name) ? String(values[name]) : token,
    );
  };
  return {
    language,
    t,
    formatTokens: (value: number) => analytics.formatTokens(value, language),
    formatNumber: (value: number) => analytics.formatNumber(value, language),
    formatUSD: (value: number) => analytics.formatUSD(value, language),
    formatBRL: (value: number) => analytics.formatBRL(value, language),
    formatDate: (value: string) => analytics.formatDate(value, language),
    formatTime: (value: string) => analytics.formatTime(value, language),
    formatDecimal: (value: number, digits = 1) =>
      new Intl.NumberFormat(language, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value),
  };
}
