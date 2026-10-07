// English dictionary for the TUI. Keys are the Portuguese source messages, the
// same convention as src/lib/i18n/messages.ts. Terminology follows the web UI.
export const tuiMessagesEn: Readonly<Record<string, string>> = {
  // Command line
  "Uso: tokenusage tui [opções]": "Usage: tokenusage tui [options]",
  "Dashboard de consumo de tokens no terminal.":
    "Token usage dashboard in the terminal.",
  "Opções:": "Options:",
  "Período inicial (padrão: 30)": "Initial period (default: 30)",
  "Canal inicial: ferramentas ou API (padrão: tool)":
    "Initial channel: tools or API (default: tool)",
  "Idioma da interface (padrão: o das preferências da dashboard)":
    "Interface language (default: the dashboard preference)",
  "Imprime a visão geral uma vez e sai": "Print the overview once and exit",
  "Mostra esta ajuda": "Show this help",
  "A opção {flag} precisa de um valor.": "The {flag} option needs a value.",
  "Use --days com 7, 30 ou 90.": "Use --days with 7, 30 or 90.",
  "Use --channel com tool ou api.": "Use --channel with tool or api.",
  "Use --lang com um destes códigos: {codes}.":
    "Use --lang with one of: {codes}.",
  "Opção desconhecida: {option}": "Unknown option: {option}",
  "Use tokenusage tui --help para ver as opções.":
    "Use tokenusage tui --help to see the options.",
  "A TUI precisa de um terminal interativo. Use --once para uma saída estática.":
    "The TUI needs an interactive terminal. Use --once for static output.",

  // Screens and tabs
  "Visão geral": "Overview",
  Atividade: "Activity",
  Fontes: "Sources",
  "Fontes de dados": "Data sources",

  // Header, footer and states
  "Canal: {value}": "Channel: {value}",
  "Período: {days} dias": "Period: {days} days",
  "Serviço: {value}": "Service: {value}",
  "Projeto: {value}": "Project: {value}",
  Ferramentas: "Tools",
  Todos: "All",
  "Atualizando…": "Refreshing…",
  "Coletando…": "Collecting…",
  "Atualizado {time}": "Updated {time}",
  "Tab telas  c canal  d período  s serviço  p projeto  r atualizar  ? ajuda  q sair":
    "Tab screens  c channel  d period  s service  p project  r refresh  ? help  q quit",
  "Digite para buscar · Enter confirma · Esc limpa":
    "Type to search · Enter confirms · Esc clears",
  "Janela pequena ({columns}×{rows}). Use pelo menos {minColumns}×{minRows} ou pressione q para sair.":
    "Window too small ({columns}×{rows}). Use at least {minColumns}×{minRows} or press q to quit.",
  "Não foi possível consultar seu histórico.": "Could not read your history.",
  "r tenta novamente · q sai": "r retries · q quits",
  "Coletando o histórico local… a primeira leitura pode demorar.":
    "Collecting your local history… the first read can take a while.",
  "⚠ Falha ao atualizar: {error} (mostrando os últimos dados)":
    "⚠ Refresh failed: {error} (showing the last data)",

  // Overview
  "{change} vs. anterior": "{change} vs. previous",
  "{input} ent. + {output} saí.": "{input} in + {output} out",
  "{count} reutilizados": "{count} reused",
  "ECONOMIA POR CACHE": "CACHE SAVINGS",
  parcial: "partial",
  "s/ cache": "vs. no cache",
  "Cache sem tarifa": "Cache without tariff",
  SESSÕES: "SESSIONS",
  CHAMADAS: "CALLS",
  modelo: "model",
  modelos: "models",
  projeto: "project",
  projetos: "projects",
  CUSTO: "COST",
  "Sem tarifa cadastrada": "No tariff set",
  Misto: "Mixed",
  Estimado: "Estimated",
  Real: "Actual",
  "Consumo diário": "Daily usage",
  "pico {peak} por coluna": "peak {peak} per column",
  "Por serviço": "By service",
  "Modelos mais usados": "Most used models",
  Projetos: "Projects",
  Nome: "Name",
  "Part.": "Share",
  "Meta mensal": "Monthly goal",
  "{used} de {goal}": "{used} of {goal}",
  ferramentas: "tools",
  "{missing} de {total} registros sem estimativa de custo (modelo sem tarifa).":
    "{missing} of {total} records without a cost estimate (model without tariff).",
  "Sem consumo nesta seleção": "No usage for this selection",
  "Nenhuma chamada de API importada": "No API calls imported",
  "Seu histórico começa aqui": "Your history starts here",
  "Importe logs de API pela dashboard web (tokenusage open). Sem registros locais, não há consumo remoto para consultar.":
    "Import API logs from the web dashboard (tokenusage open). Without local records there is no remote usage to look up.",
  "Esta seleção não tem registros de tokens. Veja a tela Fontes ou mude os filtros.":
    "This selection has no token records. Check the Sources screen or change the filters.",

  // Activity
  Sessão: "Session",
  Modelo: "Model",
  Projeto: "Project",
  Dia: "Day",
  Modelos: "Models",
  Serviço: "Service",
  Serviços: "Services",
  Sessões: "Sessions",
  sessão: "session",
  sessões: "sessions",
  "Agrupado por": "Grouped by",
  item: "item",
  itens: "items",
  "Busca:": "Search:",
  "/ buscar": "/ search",
  Última: "Last",
  Custo: "Cost",
  real: "actual",
  "est.": "est.",
  misto: "mixed",
  "{from}–{to} de {total}": "{from}–{to} of {total}",
  "* parte dos registros sem estimativa de custo":
    "* some records have no cost estimate",
  "Nenhum registro encontrado. Experimente outro período, serviço ou busca.":
    "No records found. Try another period, service or search.",

  // Sources
  "leitura local, sem chaves de API": "local read, no API keys",
  Coletando: "Collecting",
  "Sem contadores": "No counters",
  "Não encontrado": "Not found",
  "Requer atenção": "Needs attention",
  arquivo: "file",
  arquivos: "files",
  registro: "record",
  registros: "records",
  "último {date}": "last {date}",
  "⚠ {count} com falha, totais podem estar incompletos":
    "⚠ {count} failed, totals may be incomplete",
  "Nenhuma fonte neste canal.": "No sources on this channel.",

  // Help and project picker
  Atalhos: "Shortcuts",
  "Troca de tela": "Switch screen",
  "Alterna Ferramentas e APIs": "Switch between Tools and APIs",
  "Alterna o período (7, 30 e 90 dias)": "Cycle the period (7, 30 and 90 days)",
  "Alterna o serviço": "Cycle the service",
  "Escolhe o projeto": "Choose the project",
  "Busca na Atividade": "Search in Activity",
  "Agrupa a Atividade por sessão, modelo, projeto ou dia":
    "Group Activity by session, model, project or day",
  "Rola as listas": "Scroll the lists",
  "Atualiza agora (automático a cada 60 s)":
    "Refresh now (automatic every 60 s)",
  "Abre ou fecha esta ajuda": "Open or close this help",
  Sai: "Quit",
  "Janelas mais altas mostram mais rankings na Visão geral. Pressione qualquer tecla para voltar.":
    "Taller windows show more rankings in the Overview. Press any key to go back.",
  "Todos os projetos": "All projects",
  "↑↓ escolhe · Enter confirma · Esc cancela":
    "↑↓ choose · Enter confirm · Esc cancel",
};
