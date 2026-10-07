import { createContext, useContext } from "react";
import { createTuiI18n, type TuiI18n } from "./i18n";

// Without a provider (tests, helpers) screens render in English.
export const I18nContext = createContext<TuiI18n>(createTuiI18n("en"));

export const useI18n = () => useContext(I18nContext);
