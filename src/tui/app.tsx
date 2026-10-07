import { useMemo, useState } from "react";
import { Box, Text, useApp, useInput, useWindowSize } from "ink";
import { buildUsagePayload, type UsagePayload } from "../lib/usage-snapshot";
import { GROUP_MODES, type GroupMode } from "./activity-rows";
import type { TuiOptions } from "./args";
import { FilterLine } from "./components/filter-line";
import { HelpOverlay, ProjectPicker } from "./components/overlays";
import { Tabs } from "./components/tabs";
import { buildContext } from "./context";
import { createTuiI18n } from "./i18n";
import { I18nContext } from "./i18n-context";
import {
  initialFilters,
  nextChannel,
  nextPeriod,
  nextProvider,
  projectOptions,
} from "./filters";
import { clampCursor } from "./format";
import { useSnapshot } from "./hooks/use-snapshot";
import { SCREENS } from "./screens";

export const MIN_COLUMNS = 80;
export const MIN_ROWS = 24;
const CHROME_ROWS = 3; // tabs, filters and key hints

export interface AppProps {
  options: TuiOptions;
  load?: () => Promise<UsagePayload>;
  intervalMs?: number;
  // Fixed terminal size, used by tests; otherwise follows the real window.
  size?: { columns: number; rows: number };
  // Language used until the first snapshot reveals the saved preference.
  initialLanguage?: string;
}

export function App({
  options,
  load = buildUsagePayload,
  intervalMs = 60_000,
  size,
  initialLanguage,
}: AppProps) {
  const live = useWindowSize();
  const { columns, rows } = size ?? live;
  const { exit } = useApp();
  const { snapshot, loading, error, refresh } = useSnapshot(load, intervalMs);
  // --lang wins, then the language saved in the web preferences.
  const language =
    options.lang ?? snapshot?.settings.language ?? initialLanguage;
  const i18n = useMemo(() => createTuiI18n(language), [language]);
  const { t } = i18n;
  const [screen, setScreen] = useState(0);
  const [filters, setFilters] = useState(() => initialFilters(options));
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [group, setGroup] = useState<GroupMode>("session");
  const [cursor, setCursor] = useState(0);
  const [picker, setPicker] = useState<{
    options: string[];
    cursor: number;
  } | null>(null);
  const [help, setHelp] = useState(false);

  const ctx = useMemo(
    () =>
      snapshot ? buildContext(snapshot, filters, search, group, i18n) : null,
    [snapshot, filters, search, group, i18n],
  );
  const def = SCREENS[screen];
  const errorRows = error && snapshot ? 1 : 0;
  const contentRows = rows - CHROME_ROWS - errorRows;
  const pageSize = Math.max(
    1,
    Math.floor((contentRows - def.reserved) / def.itemHeight),
  );
  const count = ctx ? def.count(ctx) : 0;
  const tooSmall = columns < MIN_COLUMNS || rows < MIN_ROWS;

  const changeFilters = (next: typeof filters) => {
    setFilters(next);
    setCursor(0);
  };
  const goTo = (index: number) => {
    setScreen(index);
    setCursor(0);
  };

  useInput((input, key) => {
    if (tooSmall) {
      if (input === "q") exit();
      return;
    }
    if (help) {
      setHelp(false);
      return;
    }
    if (picker) {
      if (key.escape) setPicker(null);
      else if (key.upArrow)
        setPicker({
          ...picker,
          cursor: clampCursor(picker.cursor - 1, picker.options.length),
        });
      else if (key.downArrow)
        setPicker({
          ...picker,
          cursor: clampCursor(picker.cursor + 1, picker.options.length),
        });
      else if (key.return) {
        changeFilters({ ...filters, project: picker.options[picker.cursor] });
        setPicker(null);
      }
      return;
    }
    if (searching) {
      if (key.escape) {
        setSearch("");
        setSearching(false);
      } else if (key.return) setSearching(false);
      else if (key.backspace || key.delete)
        setSearch((value) => value.slice(0, -1));
      else if (input && !key.ctrl && !key.meta && !key.tab)
        setSearch((value) => value + input);
      else return;
      setCursor(0);
      return;
    }
    if (input === "q") exit();
    else if (input === "?") setHelp(true);
    else if (key.tab) goTo((screen + 1) % SCREENS.length);
    else if (/^[1-9]$/.test(input) && Number(input) <= SCREENS.length)
      goTo(Number(input) - 1);
    else if (input === "c")
      changeFilters({
        ...filters,
        channel: nextChannel(filters.channel),
        project: "",
      });
    else if (input === "d")
      changeFilters({ ...filters, days: nextPeriod(filters.days) });
    else if (input === "s")
      changeFilters({
        ...filters,
        provider: nextProvider(filters.provider),
        project: "",
      });
    else if (input === "p" && snapshot) {
      const available = ["", ...projectOptions(snapshot.events, filters)];
      setPicker({
        options: available,
        cursor: Math.max(0, available.indexOf(filters.project)),
      });
    } else if (input === "r") refresh();
    else if (input === "/" && def.id === "activity") setSearching(true);
    else if (input === "g" && def.id === "activity") {
      setGroup(
        GROUP_MODES[(GROUP_MODES.indexOf(group) + 1) % GROUP_MODES.length],
      );
      setCursor(0);
    } else if (key.upArrow) setCursor((value) => clampCursor(value - 1, count));
    else if (key.downArrow) setCursor((value) => clampCursor(value + 1, count));
    else if (key.pageUp)
      setCursor((value) => clampCursor(value - pageSize, count));
    else if (key.pageDown)
      setCursor((value) => clampCursor(value + pageSize, count));
  });

  const status = loading
    ? snapshot
      ? t("Atualizando…")
      : t("Coletando…")
    : snapshot
      ? t("Atualizado {time}", { time: i18n.formatTime(snapshot.generatedAt) })
      : "";

  let body;
  if (tooSmall)
    body = (
      <Text>
        {t(
          "Janela pequena ({columns}×{rows}). Use pelo menos {minColumns}×{minRows} ou pressione q para sair.",
          { columns, rows, minColumns: MIN_COLUMNS, minRows: MIN_ROWS },
        )}
      </Text>
    );
  else if (!ctx)
    body = error ? (
      <Box flexDirection="column">
        <Text bold color="red">
          {t("Não foi possível consultar seu histórico.")}
        </Text>
        <Text>{error}</Text>
        <Text dimColor>{t("r tenta novamente · q sai")}</Text>
      </Box>
    ) : (
      <Text dimColor>
        {t("Coletando o histórico local… a primeira leitura pode demorar.")}
      </Text>
    );
  else if (help) body = <HelpOverlay />;
  else if (picker)
    body = (
      <ProjectPicker
        options={picker.options}
        cursor={picker.cursor}
        current={filters.project}
        height={contentRows}
      />
    );
  else
    body = (
      <def.Component
        ctx={ctx}
        width={columns}
        height={contentRows}
        cursor={cursor}
        pageSize={pageSize}
        searching={searching}
      />
    );

  return (
    <I18nContext.Provider value={i18n}>
      <Box flexDirection="column" width={columns} height={rows}>
        <Tabs labels={SCREENS.map((item) => t(item.label))} active={screen} />
        <FilterLine filters={filters} status={status} />
        {errorRows ? (
          <Text color="red" wrap="truncate-end">
            {t("⚠ Falha ao atualizar: {error} (mostrando os últimos dados)", {
              error: error ?? "",
            })}
          </Text>
        ) : null}
        <Box flexDirection="column" flexGrow={1}>
          {body}
        </Box>
        <Text dimColor wrap="truncate-end">
          {searching
            ? t("Digite para buscar · Enter confirma · Esc limpa")
            : t(
                "Tab telas  c canal  d período  s serviço  p projeto  r atualizar  ? ajuda  q sair",
              )}
        </Text>
      </Box>
    </I18nContext.Provider>
  );
}
