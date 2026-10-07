# Tokenusage TUI — Fase 1 (leitura)

## Objetivo e decisões

O usuário quer a mesma visão de consumo de tokens da dashboard web direto no
terminal. A meta final é paridade com a web (visão geral, atividade, fontes,
preferências e tarifas, filtros, gráficos, busca e CSV). O escopo é grande,
então a entrega é dividida:

- **Fase 1 (esta spec):** telas somente de leitura — Visão geral, Atividade e
  Fontes — com filtros e atualização automática.
- **Fase 2 (spec própria):** preferências, edição de tarifas, importação de
  logs e exportação CSV.

Decisões tomadas no brainstorm:

- **Dashboard completa no terminal**, não apenas um painel compacto.
- **Standalone:** a TUI importa `src/lib` diretamente e não depende do serviço
  web nem da porta 3000.
- **Ink (React para terminal) em TypeScript.** Reaproveita a stack do projeto
  (React 19.3, TS, `tsx`, Node 24) e evita reescrever coletores, parsing e
  preços. Ink 7.1 exige React ≥ 19.3 e Node ≥ 22; ambos são atendidos. Go com
  Bubble Tea foi descartado por duplicar a lógica de `src/lib`.

Mantém-se tudo o que a web já garante: interface em português, execução local,
sem credenciais e sem ler conteúdo de conversas.

## Arquitetura e dados

A TUI vive em `src/tui/` (entrada, `screens/`, `components/`, `hooks/`) e usa
apenas imports relativos para `src/lib`, que não depende do Next.

Duas extrações pequenas no código existente, sem mudar o comportamento da web:

1. **`src/lib/usage-snapshot.ts`** com `buildUsagePayload()`. Reúne a coleta
   local, os logs importados, o status das fontes e `costMetrics`, hoje
   embutidos em `src/app/api/usage/route.ts`. A rota passa a chamar essa
   função e continua devolvendo a mesma resposta; a TUI chama a mesma função.
2. **`src/lib/overview-metrics.ts`** com as métricas que o componente
   `Overview` calcula inline: custo modelado, percentual de economia por cache
   e tokens do mês. Web e TUI passam a usar a mesma função.

Fluxo: o hook `useSnapshot` carrega no início, atualiza a cada 60 s e na tecla
`r`. O cache por arquivo/mtime dos coletores vive no processo, então as
atualizações seguintes são baratas. Filtros e gráficos usam `selectEvents`,
`totals`, `dailySeries`, `groupEvents`, `sessionGroups` e `previousChange` de
`analytics.ts`; a TUI não reimplementa cálculos.

Dados reais, `.local-data` e métricas pessoais nunca entram em código,
fixtures ou commits. Os testes usam dados sintéticos.

## Interface

Usa a tela alternativa do terminal (`alternateScreen`) e se adapta ao tamanho
com `useWindowSize`. Visual neutro e sem enfeites; cores por serviço vêm de
`providerInfo`; respeita `NO_COLOR`.

**Filtros globais** (barra superior, valem em todas as telas), os mesmos
`Filters` da web: canal (Ferramentas ou API), período (7, 30 ou 90 dias),
serviço (Todos, Codex, Claude, Grok, Gemini) e projeto.

**Telas:**

- **Visão geral:** cartões de tokens (com variação contra o período
  anterior), cache (taxa e economia estimada em USD e BRL), custo (informado,
  estimado e cobertura) e sessões; barra de progresso da meta mensal; série
  diária empilhada por serviço em blocos Unicode (`▁▂▃▄▅▆▇█`); participação por
  serviço em barras horizontais; rankings de modelos e projetos.
- **Atividade:** lista rolável com busca por projeto ou modelo; data, serviço,
  modelo, projeto, tokens e cache; agrupamento por sessão, modelo, projeto ou
  dia.
- **Fontes:** estado de cada fonte (conectada, vazia, ausente, erro), arquivos,
  eventos, último registro e avisos de registros incompletos.

**Teclas:**

| Tecla                 | Ação                                 |
| --------------------- | ------------------------------------ |
| `1` `2` `3` ou `Tab`  | Troca de tela                        |
| `c`                   | Alterna Ferramentas e API            |
| `d`                   | Alterna o período (7 → 30 → 90 dias) |
| `s`                   | Alterna o serviço                    |
| `p`                   | Abre o seletor de projeto            |
| `/`                   | Busca (na Atividade)                 |
| `g`                   | Alterna o agrupamento (na Atividade) |
| `↑` `↓` `PgUp` `PgDn` | Rolagem                              |
| `r`                   | Atualiza agora                       |
| `?`                   | Ajuda                                |
| `q`                   | Sai                                  |

Dados ausentes aparecem como `—`, nunca como zero, como na web. Fontes ausentes
ou vazias não distorcem os totais.

## Comando e erros

`tokenusage tui` (em desenvolvimento, `npm run tui`). Flags: `--days`,
`--channel` (filtros iniciais) e `--once`, que renderiza um quadro estático da
Visão geral e sai, para pipes e smoke tests.

- Falha em uma atualização: mantém o último snapshot válido e mostra uma faixa
  de erro no rodapé. A tela de erro cheia só aparece se a primeira carga falhar.
- Primeira carga: indicador de progresso.
- Sem TTY (stdout redirecionado) e sem `--once`: mensagem clara e código 1.
- Terminal menor que 80×24: aviso em vez de layout quebrado; re-renderiza ao
  redimensionar.

## Testes

Mesmo runner do projeto (`tsx --test`):

- **Unitários:** `usage-snapshot` (a rota devolve o mesmo payload),
  `overview-metrics` (sem dados, sem tarifa, meta nula) e os formatadores de
  barras e sparklines.
- **Componentes:** `ink-testing-library` (`lastFrame()`, `stdin.write()`) para
  navegação, filtros e busca com um snapshot sintético.
- **Smoke:** `tokenusage tui --once` contra o perfil de
  `scripts/prepare-test-profile.ts`, verificando a saída.
- Os testes existentes (`analytics-pricing`, `pricing`, `parsers`, `settings` e
  o e2e do Playwright) continuam passando.

## Empacotamento

- Dependências: `ink` (runtime); `ink-testing-library` e `esbuild` (dev).
- Scripts: `npm run tui` (desenvolvimento, via `tsx`) e `npm run build:tui`,
  que gera `dist/tui.mjs`.
- Homebrew: a fórmula também executa `build:tui`, instala o bundle em
  `libexec` e ganha o subcomando `tokenusage tui`. O tarball em `Formula/`
  precisa ser regenerado; isso fica explícito no plano.
- README: seção em português sobre a TUI, com exemplos de dados sintéticos.

## Fora de escopo

Preferências, edição de tarifas, importação de logs e exportação CSV (Fase 2);
qualquer mudança visual na dashboard web; alteração dos coletores e do motor de
preços. A Fase 2 só precisa de que as telas sejam registradas numa lista (id,
rótulo, componente), para adicionar uma tela sem reescrever a navegação.
