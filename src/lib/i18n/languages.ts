export const LANGUAGE_CODES = [
  "pt-BR",
  "en",
  "es",
  "it",
  "fr",
  "zh-CN",
] as const;
export type Language = (typeof LANGUAGE_CODES)[number];

export const LANGUAGES: { code: Language; name: string }[] = [
  { code: "pt-BR", name: "Português (PT-BR)" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "it", name: "Italiano" },
  { code: "fr", name: "Français" },
  { code: "zh-CN", name: "简体中文" },
];

export function resolveLanguage(value: unknown): Language {
  return LANGUAGE_CODES.includes(value as Language)
    ? (value as Language)
    : "pt-BR";
}
