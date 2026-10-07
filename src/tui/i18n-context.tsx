import { createContext, useContext } from "react";
import { createTuiI18n, type TuiI18n } from "./i18n";

// Without a provider (tests, --once helpers) screens render in Portuguese.
export const I18nContext = createContext<TuiI18n>(createTuiI18n("pt-BR"));

export const useI18n = () => useContext(I18nContext);
