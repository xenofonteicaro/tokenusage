# Fase 1: Shadcn UI, Temas e Motor de Custos com Economia de Cache

## 1. Contexto e Motivação

O projeto Tokenusage lê métricas reais do perfil local do usuário (Codex, Claude Code, Grok Build e Gemini CLI) e logs de API importados. Na entrega inicial, os custos só eram exibidos quando a ferramenta fornecia o valor explicitamente (ex.: Grok em ticks e logs com `costUSD`). Ferramentas como Claude Code e Codex não fornecem custos em dólares nos arquivos locais, deixando o campo como desconhecido.

Esta Fase 1 adiciona:

1. **Design System com Shadcn UI e Suporte a Temas (Light / Dark / System)** usando Tailwind CSS e `next-themes`.
2. **Motor de Precificação por Modelo**: cálculo de custo estimado quando o custo nativo não é informado.
3. **Métrica de Economia por Cache**: cálculo da economia obtida graças ao reaproveitamento de tokens em cache.
4. **Cotação de Câmbio (USD -> BRL)** configurável para unificar o planejamento financeiro com as mensalidades já existentes em BRL.

## 2. Decisões Arquiteturais

### 2.1 UI e Temas (Tailwind v4 + Shadcn + next-themes)

- Utilização de Tailwind v4 com `@tailwindcss/postcss` ou imports nativos CSS e variáveis CSS para cores (HSL/OKLCH).
- `next-themes` para persistência e detecção de tema do sistema operacional sem flash de tema incorreto (FOUC).
- Criação dos componentes atômicos em `src/components/ui/`: `button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`, `table.tsx`, `switch.tsx`, `dropdown-menu.tsx`.
- Refatoração dos componentes existentes (`overview.tsx`, `dashboard.tsx`, `activity-panel.tsx`, `sources-panel.tsx`, `settings-panel.tsx`, `usage-chart.tsx`) para utilizar a biblioteca de componentes e os tokens de design.

### 2.2 Motor de Custos (`src/lib/pricing/`)

- Mapeamento padrão embutido em `src/lib/pricing/defaults.ts` com tarifas por 1 milhão de tokens (input, output, cache-read):
  - **Anthropic**:
    - `claude-3-7-sonnet`: Input $3.00, Output $15.00, Cache Read $0.30
    - `claude-3-5-sonnet`: Input $3.00, Output $15.00, Cache Read $0.30
    - `claude-3-5-haiku`: Input $0.80, Output $4.00, Cache Read $0.08
    - `claude-3-opus`: Input $15.00, Output $75.00, Cache Read $1.50
  - **OpenAI**:
    - `gpt-4o`: Input $2.50, Output $10.00, Cache Read $1.25
    - `gpt-4o-mini`: Input $0.15, Output $0.60, Cache Read $0.075
    - `o1`: Input $15.00, Output $60.00, Cache Read $7.50
    - `o3-mini`: Input $1.10, Output $4.40, Cache Read $0.55
    - Fallback para codex: `gpt-5.6-terra` / equivalentes
  - **xAI**:
    - `grok-2`: Input $2.00, Output $10.00, Cache Read $0.50
    - `grok-3`: Input $3.00, Output $15.00, Cache Read $0.75
  - **Google**:
    - `gemini-1.5-pro`: Input $3.50, Output $10.50, Cache Read $0.875
    - `gemini-1.5-flash`: Input $0.075, Output $0.30, Cache Read $0.01875
    - `gemini-2.0-flash`: Input $0.10, Output $0.40, Cache Read $0.025
- Casamento de modelo tolerante a sufixos/datas (ex.: `claude-3-7-sonnet-20250219` casa com `claude-3-7-sonnet`).
- Usuário pode sobrescrever ou adicionar preços em `Preferências` (persistido em `.local-data/settings.json`).

### 2.3 Regras de Exibição de Custos e Economia

- **Custo Real**: Sempre preservado se informado pelo log da ferramenta (ex.: Grok ou logs de API).
- **Custo Estimado**: Calculado para eventos sem custo nativo multiplicando tokens por tarifário do modelo. Se o modelo não for reconhecido, o custo daquele evento permanece não-estimado (cobertura explícita).
- **Economia por Cache**:
  - `tokens_cache * (preço_input - preço_cache) / 1_000_000`.
  - Exibido em destaque como valor economizado em USD e BRL.
- **Cotação USD / BRL**:
  - Padrão 5.75, customizável em Preferências.

### 2.4 Armazenamento e Segurança

- Customizações de preços e câmbio são salvas no arquivo existente `.local-data/settings.json`.
- Nenhum histórico real, token ou credencial é versionado no Git.
- Validação estrita via Zod para as novas configurações de preço.

## 3. Plano de Testes

- **Testes Unitários**:
  - Verificação de casamento de nomes de modelos (exatos e por prefixo).
  - Cálculo de custo exato com e sem cache.
  - Cálculo de economia de cache.
  - Prioridade entre custo real vs. custo estimado.
  - Persistência e sobreposição de preços em configurações.
- **Testes de Navegador (Playwright)**:
  - Alternância de temas Claro / Escuro / Sistema refletindo classes no `<html>`.
  - Exibição do card de Economia de Cache e badge de Custo Estimado.
  - Edição de cotação e preços no painel de configurações.
