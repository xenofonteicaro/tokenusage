// Historical localized labels also seeded persisted import IDs. Preserve their
// exact bytes for compatibility; current display labels use English sources.
export const LEGACY_IMPORTED_API_PROJECT = "API importada";

// Fallback labels written by releases that used Portuguese source text, mapped
// to the current English values. Only these exact reserved labels are mapped;
// user-provided project and model names are never rewritten.
const LEGACY_FALLBACK_LABELS: Readonly<Record<string, string>> = {
  "Sem projeto": "No project",
  "Modelo não informado": "Model not provided",
  [LEGACY_IMPORTED_API_PROJECT]: "Imported API",
};
const LEGACY_GENERATED_PROJECT = /^Projeto (\w{8})$/;

export function currentFallbackLabel(value: string): string {
  if (Object.hasOwn(LEGACY_FALLBACK_LABELS, value))
    return LEGACY_FALLBACK_LABELS[value];
  const generated = LEGACY_GENERATED_PROJECT.exec(value);
  return generated ? `Project ${generated[1]}` : value;
}
