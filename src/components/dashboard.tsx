"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  ChevronDown,
  CircleHelp,
  Cpu,
  Database,
  Folder,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Monitor,
  Plug2,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  dayKey,
  exportCSV,
  formatTime,
  selectEvents,
  type Filters,
} from "@/lib/analytics";
import {
  PROVIDERS,
  providerInfo,
  type Channel,
  type Provider,
  type Snapshot,
} from "@/lib/types";
import { ActivityPanel } from "./activity-panel";
import { Overview } from "./overview";
import { SettingsPanel } from "./settings-panel";
import { SourcesPanel } from "./sources-panel";
import { ThemeToggle } from "./theme-toggle";

type View = "overview" | "activity" | "sources" | "settings";
const views: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "activity", label: "Atividade", icon: Activity },
  { id: "sources", label: "Fontes de dados", icon: Plug2 },
  { id: "settings", label: "Preferências", icon: SlidersHorizontal },
];
export default function Dashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const [view, setView] = useState<View>("overview"),
    [mobileNav, setMobileNav] = useState(false);
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
    } catch (error) {
      setError(error instanceof Error ? error.message : "Falha na coleta.");
    } finally {
      setBusy(false);
    }
  }, []);
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
  const connected =
    snapshot?.sources.filter(
      (source) =>
        source.channel === filters.channel && source.state === "connected",
    ).length ?? 0;
  const warnings =
    snapshot?.sources
      .filter((source) => source.channel === filters.channel)
      .reduce((sum, source) => sum + source.warnings, 0) ?? 0;
  const title = views.find((item) => item.id === view)!.label;
  function navigate(next: View) {
    setView(next);
    setMobileNav(false);
  }
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
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      {mobileNav && (
        <button
          aria-label="Fechar navegação"
          className="nav-scrim"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <Link className="brand" href="/" aria-label="Tokenusage início">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
          </span>
          tokenusage<span className="brand-dot">.</span>
        </Link>
        <div className="workspace">
          <span className="workspace-icon">
            <Layers3 size={17} />
          </span>
          <div>
            <strong>Meu workspace</strong>
            <small>Pessoal · local</small>
          </div>
          <span className="workspace-badge">1</span>
        </div>
        <span className="nav-label">ACOMPANHAMENTO</span>
        <nav aria-label="Navegação principal">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "sources" && snapshot && (
                <small>
                  {
                    snapshot.sources.filter(
                      (source) =>
                        source.channel === "tool" &&
                        source.state === "connected",
                    ).length
                  }
                </small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-sources">
          <span className="nav-label">SUAS FERRAMENTAS</span>
          {PROVIDERS.map((provider) => {
            const source = snapshot?.sources.find(
              (source) =>
                source.provider === provider && source.channel === "tool",
            );
            return (
              <button
                key={provider}
                onClick={() => {
                  setFilters({
                    ...filters,
                    provider,
                    channel: "tool",
                    project: "",
                  });
                  navigate("overview");
                }}
              >
                <span className={`provider-letter ${provider}`}>
                  {providerInfo[provider].letter}
                </span>
                <span>{providerInfo[provider].name}</span>
                <i
                  className={
                    source?.state === "connected" ? "online-dot" : "offline-dot"
                  }
                  aria-label={
                    source?.state === "connected"
                      ? "Histórico disponível"
                      : "Sem histórico de tokens"
                  }
                />
              </button>
            );
          })}
        </div>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={18} />
            <strong>Seus dados. Sua máquina.</strong>
            <p>Métricas locais, sem enviar suas conversas para a nuvem.</p>
            <button onClick={() => navigate("sources")}>
              Sobre a coleta <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="computer-profile">
            <span>
              <Monitor size={18} />
            </span>
            <div>
              <strong>Este computador</strong>
              <small>America/Sao_Paulo</small>
            </div>
            <i className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label={mobileNav ? "Fechar menu" : "Abrir menu"}
            >
              {mobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="breadcrumb">
              Meu workspace <span>/</span> <strong>{title}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="local-indicator">
              <i />
              Dados locais
            </span>
            <ThemeToggle />
            <button
              className="icon-button"
              aria-label="Como funciona a coleta"
              onClick={() => navigate("sources")}
            >
              <CircleHelp size={18} />
            </button>
            <span className="avatar">EU</span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">INTELIGÊNCIA SOBRE SEU USO DE IA</span>
              <h1>
                {title}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {view === "overview"
                  ? "Todos os seus tokens. Uma perspectiva mais clara."
                  : view === "activity"
                    ? "Explore o consumo das suas sessões, sem o conteúdo das conversas."
                    : view === "sources"
                      ? "Saiba de onde vêm os números e quais dados estão disponíveis."
                      : "Um acompanhamento que faz sentido para a sua rotina."}
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="button"
                disabled={busy}
                onClick={() => void refresh()}
              >
                <RefreshCw size={15} className={busy ? "spinning" : ""} />
                {busy && snapshot ? "Atualizando" : "Atualizar"}
              </button>
              {["overview", "activity"].includes(view) && (
                <button
                  className="button export-button"
                  disabled={!events.length}
                  onClick={download}
                >
                  <ArrowDownToLine size={15} />
                  Exportar CSV
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              <span>
                {error}
                {snapshot &&
                  " Os números abaixo são da última coleta bem-sucedida."}
              </span>
              <button onClick={() => void refresh()}>Tentar novamente</button>
            </div>
          )}
          {!snapshot && !error ? (
            <div className="loading-state" role="status">
              <LoaderCircle className="spinning" size={30} />
              <h2>Lendo seu histórico local</h2>
              <p>
                A primeira coleta pode levar alguns instantes. Depois, os
                arquivos inalterados ficam em cache.
              </p>
              <div className="skeleton-grid">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} />
                ))}
              </div>
            </div>
          ) : (
            snapshot && (
              <>
                {["overview", "activity"].includes(view) && (
                  <div className="filter-bar">
                    <div
                      className="channel-tabs"
                      role="group"
                      aria-label="Origem do consumo"
                    >
                      <button
                        className={filters.channel === "tool" ? "selected" : ""}
                        onClick={() => changeChannel("tool")}
                      >
                        <Cpu size={15} />
                        Ferramentas
                      </button>
                      <button
                        className={filters.channel === "api" ? "selected" : ""}
                        onClick={() => changeChannel("api")}
                      >
                        <Database size={15} />
                        APIs
                      </button>
                    </div>
                    <div className="filters">
                      <label className="select-wrap">
                        <select
                          aria-label="Serviço"
                          value={filters.provider}
                          onChange={(event) =>
                            setFilters({
                              ...filters,
                              provider: event.target.value as Provider | "all",
                              project: "",
                            })
                          }
                        >
                          <option value="all">Todos os serviços</option>
                          {PROVIDERS.map((provider) => (
                            <option key={provider} value={provider}>
                              {providerInfo[provider].name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} />
                      </label>
                      <label className="select-wrap project-select">
                        <Folder size={14} />
                        <select
                          aria-label="Projeto"
                          value={filters.project}
                          onChange={(event) =>
                            setFilters({
                              ...filters,
                              project: event.target.value,
                            })
                          }
                        >
                          <option value="">Todos os projetos</option>
                          {projects.map((project) => (
                            <option key={project} value={project}>
                              {project}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} />
                      </label>
                      <label className="select-wrap">
                        <select
                          aria-label="Período"
                          value={filters.days}
                          onChange={(event) =>
                            setFilters({
                              ...filters,
                              days: Number(event.target.value),
                            })
                          }
                        >
                          <option value={7}>Últimos 7 dias</option>
                          <option value={30}>Últimos 30 dias</option>
                          <option value={90}>Últimos 90 dias</option>
                        </select>
                        <ChevronDown size={14} />
                      </label>
                    </div>
                  </div>
                )}
                {view === "overview" && (
                  <Overview
                    snapshot={snapshot}
                    events={events}
                    filters={filters}
                    onFilter={setFilters}
                    navigate={navigate}
                  />
                )}
                {view === "activity" && (
                  <ActivityPanel
                    key={`${filters.channel}:${filters.provider}:${filters.days}:${filters.project}`}
                    events={events}
                    channel={filters.channel}
                  />
                )}
                {view === "sources" && (
                  <SourcesPanel sources={snapshot.sources} onImport={refresh} />
                )}
                {view === "settings" && (
                  <SettingsPanel
                    settings={snapshot.settings}
                    onSave={(settings) =>
                      setSnapshot({ ...snapshot, settings })
                    }
                  />
                )}
                {warnings > 0 && (
                  <button
                    className="collection-warning"
                    onClick={() => navigate("sources")}
                  >
                    {warnings} registros ou arquivos não puderam ser lidos. Ver
                    diagnóstico <ArrowUpRight size={12} />
                  </button>
                )}
                <footer className="page-footer">
                  <span>
                    <i className="online-dot" />
                    {connected} de 4 fontes{" "}
                    {filters.channel === "tool" ? "locais" : "importadas"} com
                    histórico <span>·</span> Atualizado às{" "}
                    {formatTime(snapshot.generatedAt)}
                  </span>
                  <span>
                    Horários de São Paulo <span>·</span> Histórico de até 90
                    dias
                  </span>
                </footer>
              </>
            )
          )}
        </main>
      </div>
    </div>
  );
}
