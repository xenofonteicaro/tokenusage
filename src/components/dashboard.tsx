"use client";
import { useI18n } from "./language-provider";
import { LanguageProvider } from "./language-provider";
import { resolveLanguage } from "@/lib/i18n/languages";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  ChartNoAxesColumnIcon,
  DownloadIcon,
  LayoutDashboardIcon,
  PlugIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import {
  dayKey,
  exportCSV,
  selectEvents,
  totals,
  type Filters,
} from "@/lib/analytics";
import {
  PROVIDERS,
  providerInfo,
  type Channel,
  type Provider,
  type Snapshot,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ActivityPanel } from "./activity-panel";
import { Overview } from "./overview";
import { SettingsPanel } from "./settings-panel";
import { SourcesPanel } from "./sources-panel";
import { ThemeToggle } from "./theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type View = "overview" | "activity" | "sources" | "settings";
const views: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboardIcon },
  { id: "activity", label: "Atividade", icon: ActivityIcon },
  { id: "sources", label: "Fontes de dados", icon: PlugIcon },
  { id: "settings", label: "Preferências", icon: SlidersHorizontalIcon },
];

export default function Dashboard() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
}

function DashboardContent() {
  const { t, setLanguage, formatTime } = useI18n();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const [view, setView] = useState<View>("overview");
  const [filters, setFilters] = useState<Filters>({
    channel: "tool",
    days: 30,
    provider: "all",
    project: "",
  });
  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/usage", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "Não foi possível consultar seu histórico.",
        );
      setSnapshot(result);
      setLanguage(resolveLanguage(result.settings.language));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Falha na coleta.");
    } finally {
      setBusy(false);
    }
  }, [setLanguage]);
  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [refresh]);
  const events = useMemo(
    () =>
      snapshot
        ? selectEvents(snapshot.events, filters, new Date(snapshot.generatedAt))
        : [],
    [snapshot, filters],
  );
  const projects = useMemo(
    () =>
      [
        ...new Set(
          (snapshot?.events ?? [])
            .filter(
              (row) =>
                row.channel === filters.channel &&
                (filters.provider === "all" ||
                  row.provider === filters.provider),
            )
            .map((row) => row.project),
        ),
      ].sort(),
    [snapshot, filters.channel, filters.provider],
  );
  const toolTotals = useMemo(() => {
    if (!snapshot) return null;
    const now = new Date(snapshot.generatedAt);
    return Object.fromEntries(
      PROVIDERS.map((provider) => [
        provider,
        totals(
          selectEvents(
            snapshot.events,
            { channel: "tool", days: filters.days, provider, project: "" },
            now,
          ),
        ).tokens,
      ]),
    ) as Record<Provider, number>;
  }, [snapshot, filters.days]);
  const connected =
    snapshot?.sources.filter(
      (source) =>
        source.channel === filters.channel && source.state === "connected",
    ).length ?? 0;
  const warnings =
    snapshot?.sources
      .filter((source) => source.channel === filters.channel)
      .reduce((sum, source) => sum + source.warnings, 0) ?? 0;
  const title = t(views.find((item) => item.id === view)!.label);
  const exportable = ["overview", "activity"].includes(view);
  function changeChannel(channel: Channel) {
    setFilters({ ...filters, channel, project: "" });
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportCSV(events)], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `tokenusage-${filters.channel}-${dayKey(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <SidebarProvider>
      <AppSidebar
        view={view}
        snapshot={snapshot}
        toolTotals={toolTotals}
        activeProvider={filters.channel === "tool" ? filters.provider : "all"}
        onNavigate={setView}
        onPickProvider={(provider) => {
          setFilters({ ...filters, provider, channel: "tool", project: "" });
          setView("overview");
        }}
      />
      <SidebarInset id="main">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
        >
          {t("Ir para o conteúdo")}
        </a>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger
              className="-ml-1"
              aria-label={t("Alternar menu lateral")}
            />
            <Separator
              orientation="vertical"
              className="mx-2 data-vertical:h-4"
            />
            <h1 className="truncate text-base font-medium">{title}</h1>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                aria-label={
                  busy && snapshot ? t("Atualizando") : t("Atualizar")
                }
                onClick={() => void refresh()}
              >
                <RefreshCwIcon
                  data-icon="inline-start"
                  className={cn(busy && "animate-spin")}
                />
                <span className="hidden sm:inline">
                  {busy && snapshot ? t("Atualizando") : t("Atualizar")}
                </span>
              </Button>
              {exportable && (
                <Button
                  size="sm"
                  disabled={!events.length}
                  aria-label={t("Exportar CSV")}
                  onClick={download}
                >
                  <DownloadIcon data-icon="inline-start" />
                  <span className="hidden sm:inline">{t("Exportar CSV")}</span>
                </Button>
              )}
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          {error && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>{error}</AlertTitle>
              <AlertDescription>
                {snapshot
                  ? t("Os números abaixo são da última coleta bem-sucedida.")
                  : t("Nenhum dado foi carregado ainda.")}{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline underline-offset-3"
                  onClick={() => void refresh()}
                >
                  {t("Tentar novamente")}
                </button>
              </AlertDescription>
            </Alert>
          )}
          {!snapshot && !error ? (
            <div role="status" className="flex flex-col gap-4 md:gap-6">
              <p className="text-sm text-muted-foreground">
                {t(
                  "Lendo seu histórico local. A primeira coleta pode levar alguns instantes; depois, os arquivos inalterados ficam em cache.",
                )}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-80 rounded-xl" />
            </div>
          ) : (
            snapshot && (
              <>
                {exportable && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Tabs
                      value={filters.channel}
                      onValueChange={(value) => changeChannel(value as Channel)}
                    >
                      <TabsList aria-label={t("Origem do consumo")}>
                        <TabsTrigger value="tool">
                          {t("Ferramentas")}
                        </TabsTrigger>
                        <TabsTrigger value="api">APIs</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                      <NativeSelect
                        aria-label={t("Serviço")}
                        className="w-full sm:w-44"
                        value={filters.provider}
                        onChange={(event) =>
                          setFilters({
                            ...filters,
                            provider: event.target.value as Provider | "all",
                            project: "",
                          })
                        }
                      >
                        <NativeSelectOption value="all">
                          {t("Todos os serviços")}
                        </NativeSelectOption>
                        {PROVIDERS.map((provider) => (
                          <NativeSelectOption key={provider} value={provider}>
                            {providerInfo[provider].name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <NativeSelect
                        aria-label={t("Projeto")}
                        className="w-full sm:w-44"
                        value={filters.project}
                        onChange={(event) =>
                          setFilters({
                            ...filters,
                            project: event.target.value,
                          })
                        }
                      >
                        <NativeSelectOption value="">
                          {t("Todos os projetos")}
                        </NativeSelectOption>
                        {projects.map((project) => (
                          <NativeSelectOption key={project} value={project}>
                            {project}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <NativeSelect
                        aria-label={t("Período")}
                        className="col-span-2 w-full sm:w-40"
                        value={filters.days}
                        onChange={(event) =>
                          setFilters({
                            ...filters,
                            days: Number(event.target.value),
                          })
                        }
                      >
                        <NativeSelectOption value={7}>
                          {t("Últimos 7 dias")}
                        </NativeSelectOption>
                        <NativeSelectOption value={30}>
                          {t("Últimos 30 dias")}
                        </NativeSelectOption>
                        <NativeSelectOption value={90}>
                          {t("Últimos 90 dias")}
                        </NativeSelectOption>
                      </NativeSelect>
                    </div>
                  </div>
                )}
                {view === "overview" && (
                  <Overview
                    snapshot={snapshot}
                    events={events}
                    filters={filters}
                    onFilter={setFilters}
                    navigate={setView}
                  />
                )}
                {view === "activity" && (
                  <ActivityPanel
                    key={`${filters.channel}:${filters.provider}:${filters.days}:${filters.project}`}
                    events={events}
                    channel={filters.channel}
                    pricingConfig={{
                      customPrices: snapshot.settings.customPricing,
                      usdToBrlRate: snapshot.settings.usdToBrlRate,
                    }}
                  />
                )}
                {view === "sources" && (
                  <SourcesPanel sources={snapshot.sources} onImport={refresh} />
                )}
                {view === "settings" && (
                  <SettingsPanel
                    settings={snapshot.settings}
                    onSave={(settings) => {
                      setSnapshot({ ...snapshot, settings });
                      setLanguage(resolveLanguage(settings.language));
                    }}
                  />
                )}
                {warnings > 0 && (
                  <Alert>
                    <TriangleAlertIcon />
                    <AlertTitle>
                      {t(
                        "{count} registros ou arquivos não puderam ser lidos",
                        { count: warnings },
                      )}
                    </AlertTitle>
                    <AlertDescription>
                      {t("Os totais podem estar incompletos.")}{" "}
                      <button
                        type="button"
                        className="font-medium text-foreground underline underline-offset-3"
                        onClick={() => setView("sources")}
                      >
                        {t("Ver diagnóstico")}
                      </button>
                    </AlertDescription>
                  </Alert>
                )}
                <footer className="mt-auto flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {t("{count} de 4 fontes {kind} com histórico", {
                      count: connected,
                      kind: t(
                        filters.channel === "tool" ? "locais" : "importadas",
                      ),
                    })}{" "}
                    ·{" "}
                    {t("Atualizado às {time}", {
                      time: formatTime(snapshot.generatedAt),
                    })}
                  </span>
                  <span>
                    {t("Horários de São Paulo · Histórico de até 90 dias")}
                  </span>
                </footer>
              </>
            )
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar({
  view,
  snapshot,
  toolTotals,
  activeProvider,
  onNavigate,
  onPickProvider,
}: {
  view: View;
  snapshot: Snapshot | null;
  toolTotals: Record<Provider, number> | null;
  activeProvider: Provider | "all";
  onNavigate: (view: View) => void;
  onPickProvider: (provider: Provider) => void;
}) {
  const { t, formatTokens } = useI18n();
  const { setOpenMobile } = useSidebar();
  const connectedTools =
    snapshot?.sources.filter(
      (source) => source.channel === "tool" && source.state === "connected",
    ) ?? [];
  function go(next: View) {
    onNavigate(next);
    setOpenMobile(false);
  }
  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => go("overview")}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ChartNoAxesColumnIcon />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">tokenusage</span>
                <span className="truncate text-xs text-muted-foreground">
                  {t("Uso local de IA")}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("Acompanhamento")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {views.map(({ id, label, icon: Icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={view === id}
                    aria-current={view === id ? "page" : undefined}
                    onClick={() => go(id)}
                  >
                    <Icon />
                    <span>{t(label)}</span>
                  </SidebarMenuButton>
                  {id === "sources" && snapshot && (
                    <SidebarMenuBadge>{connectedTools.length}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("Ferramentas")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PROVIDERS.map((provider) => {
                const available = connectedTools.some(
                  (source) => source.provider === provider,
                );
                return (
                  <SidebarMenuItem key={provider}>
                    <SidebarMenuButton
                      isActive={
                        view === "overview" && activeProvider === provider
                      }
                      onClick={() => {
                        onPickProvider(provider);
                        setOpenMobile(false);
                      }}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "size-2 rounded-full",
                          available
                            ? "bg-foreground/70"
                            : "border border-muted-foreground",
                        )}
                      />
                      <span>{providerInfo[provider].name}</span>
                    </SidebarMenuButton>
                    {snapshot && (
                      <SidebarMenuBadge>
                        {available && toolTotals
                          ? formatTokens(toolTotals[provider])
                          : t("sem dados")}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex gap-2 rounded-lg border p-3 text-xs text-muted-foreground">
          <ShieldCheckIcon className="size-4 shrink-0 text-foreground" />
          <div className="flex flex-col gap-1">
            <p>
              <span className="font-medium text-foreground">
                {t("Fica nesta máquina.")}
              </span>{" "}
              {t("Só contadores e nomes de modelo; nenhuma conversa é lida.")}
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1 self-start font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => go("sources")}
            >
              {t("Sobre a coleta")}
              <ArrowUpRightIcon className="size-3" />
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
