// Portuguese (Brazil) dictionary for the TUI. Keys are the English source
// messages, the same convention as src/lib/i18n/messages.ts, and terminology
// matches the web UI. English needs no dictionary: the key is the text.
export const tuiMessagesPt: Readonly<Record<string, string>> = {
  // Command line
  "Usage: tokenusage tui [options]": "Uso: tokenusage tui [opções]",
  "Token usage dashboard in the terminal.":
    "Dashboard de consumo de tokens no terminal.",
  "Options:": "Opções:",
  "Initial period (default: 30)": "Período inicial (padrão: 30)",
  "Initial channel: tools or API (default: tool)":
    "Canal inicial: ferramentas ou API (padrão: tool)",
  "Interface language (default: the dashboard preference)":
    "Idioma da interface (padrão: o das preferências da dashboard)",
  "Print the overview once and exit": "Imprime a visão geral uma vez e sai",
  "Show this help": "Mostra esta ajuda",
  "The {flag} option needs a value.": "A opção {flag} precisa de um valor.",
  "Use --days with 7, 30 or 90.": "Use --days com 7, 30 ou 90.",
  "Use --channel with tool or api.": "Use --channel com tool ou api.",
  "Use --lang with one of: {codes}.":
    "Use --lang com um destes códigos: {codes}.",
  "Unknown option: {option}": "Opção desconhecida: {option}",
  "Use tokenusage tui --help to see the options.":
    "Use tokenusage tui --help para ver as opções.",
  "The TUI needs an interactive terminal. Use --once for static output.":
    "A TUI precisa de um terminal interativo. Use --once para uma saída estática.",

  // Screens and tabs
  Overview: "Visão geral",
  Activity: "Atividade",
  Sources: "Fontes",
  "Data sources": "Fontes de dados",

  // Header, footer and states
  "Channel: {value}": "Canal: {value}",
  "Period: {days} days": "Período: {days} dias",
  "Service: {value}": "Serviço: {value}",
  "Project: {value}": "Projeto: {value}",
  Tools: "Ferramentas",
  All: "Todos",
  "Refreshing…": "Atualizando…",
  "Collecting…": "Coletando…",
  "Updated {time}": "Atualizado {time}",
  "Tab screens  c channel  d period  s service  p project  r refresh  ? help  q quit":
    "Tab telas  c canal  d período  s serviço  p projeto  r atualizar  ? ajuda  q sair",
  "Type to search · Enter confirms · Esc clears":
    "Digite para buscar · Enter confirma · Esc limpa",
  "Window too small ({columns}×{rows}). Use at least {minColumns}×{minRows} or press q to quit.":
    "Janela pequena ({columns}×{rows}). Use pelo menos {minColumns}×{minRows} ou pressione q para sair.",
  "Could not read your history.": "Não foi possível consultar seu histórico.",
  "r retries · q quits": "r tenta novamente · q sai",
  "Collecting your local history… the first read can take a while.":
    "Coletando o histórico local… a primeira leitura pode demorar.",
  "⚠ Refresh failed: {error} (showing the last data)":
    "⚠ Falha ao atualizar: {error} (mostrando os últimos dados)",

  // Overview
  "{change} vs. previous": "{change} vs. anterior",
  "{input} in + {output} out": "{input} ent. + {output} saí.",
  "{count} reused": "{count} reutilizados",
  "CACHE SAVINGS": "ECONOMIA POR CACHE",
  partial: "parcial",
  "vs. no cache": "s/ cache",
  "Cache without tariff": "Cache sem tarifa",
  SESSIONS: "SESSÕES",
  CALLS: "CHAMADAS",
  model: "modelo",
  models: "modelos",
  project: "projeto",
  projects: "projetos",
  COST: "CUSTO",
  "No tariff set": "Sem tarifa cadastrada",
  Mixed: "Misto",
  Estimated: "Estimado",
  Actual: "Real",
  "Daily usage": "Consumo diário",
  "peak {peak} per column": "pico {peak} por coluna",
  "By service": "Por serviço",
  "Most used models": "Modelos mais usados",
  Projects: "Projetos",
  Name: "Nome",
  Share: "Part.",
  "Monthly goal": "Meta mensal",
  "{used} of {goal}": "{used} de {goal}",
  tools: "ferramentas",
  "{missing} of {total} records without a cost estimate (model without tariff).":
    "{missing} de {total} registros sem estimativa de custo (modelo sem tarifa).",
  "No usage for this selection": "Sem consumo nesta seleção",
  "No API calls imported": "Nenhuma chamada de API importada",
  "Your history starts here": "Seu histórico começa aqui",
  "Import API logs from the web dashboard (tokenusage open). Without local records there is no remote usage to look up.":
    "Importe logs de API pela dashboard web (tokenusage open). Sem registros locais, não há consumo remoto para consultar.",
  "This selection has no token records. Check the Sources screen or change the filters.":
    "Esta seleção não tem registros de tokens. Veja a tela Fontes ou mude os filtros.",

  // Activity
  Session: "Sessão",
  Model: "Modelo",
  Project: "Projeto",
  Day: "Dia",
  Models: "Modelos",
  Service: "Serviço",
  Services: "Serviços",
  Sessions: "Sessões",
  session: "sessão",
  sessions: "sessões",
  "Grouped by": "Agrupado por",
  item: "item",
  items: "itens",
  "Search:": "Busca:",
  "/ search": "/ buscar",
  Last: "Última",
  Cost: "Custo",
  actual: "real",
  "est.": "est.",
  mixed: "misto",
  "{from}–{to} of {total}": "{from}–{to} de {total}",
  "* some records have no cost estimate":
    "* parte dos registros sem estimativa de custo",
  "No records found. Try another period, service or search.":
    "Nenhum registro encontrado. Experimente outro período, serviço ou busca.",

  // Sources
  "local read, no API keys": "leitura local, sem chaves de API",
  Collecting: "Coletando",
  "No counters": "Sem contadores",
  "Not found": "Não encontrado",
  "Needs attention": "Requer atenção",
  file: "arquivo",
  files: "arquivos",
  record: "registro",
  records: "registros",
  "last {date}": "último {date}",
  "⚠ {count} failed, totals may be incomplete":
    "⚠ {count} com falha, totais podem estar incompletos",
  "No sources on this channel.": "Nenhuma fonte neste canal.",

  // Help and project picker
  Shortcuts: "Atalhos",
  "Switch screen": "Troca de tela",
  "Switch between Tools and APIs": "Alterna Ferramentas e APIs",
  "Cycle the period (7, 30 and 90 days)": "Alterna o período (7, 30 e 90 dias)",
  "Cycle the service": "Alterna o serviço",
  "Choose the project": "Escolhe o projeto",
  "Search in Activity": "Busca na Atividade",
  "Group Activity by session, model, project or day":
    "Agrupa a Atividade por sessão, modelo, projeto ou dia",
  "Scroll the lists": "Rola as listas",
  "Refresh now (automatic every 60 s)":
    "Atualiza agora (automático a cada 60 s)",
  "Open or close this help": "Abre ou fecha esta ajuda",
  Quit: "Sai",
  "Taller windows show more rankings in the Overview. Press any key to go back.":
    "Janelas mais altas mostram mais rankings na Visão geral. Pressione qualquer tecla para voltar.",
  "All projects": "Todos os projetos",
  "↑↓ choose · Enter confirm · Esc cancel":
    "↑↓ escolhe · Enter confirma · Esc cancela",
};
