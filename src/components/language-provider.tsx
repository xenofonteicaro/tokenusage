"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createI18n } from "@/lib/i18n/translate";
import type { Language } from "@/lib/i18n/languages";

const LanguageContext = createContext<
  | (ReturnType<typeof createI18n> & {
      setLanguage: React.Dispatch<React.SetStateAction<Language>>;
    })
  | null
>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("pt-BR");
  const value = useMemo(
    () => ({ ...createI18n(language), setLanguage }),
    [language],
  );
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = value.t("Tokenusage · Seu consumo de IA");
  }, [language, value]);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider is required.");
  return value;
}
