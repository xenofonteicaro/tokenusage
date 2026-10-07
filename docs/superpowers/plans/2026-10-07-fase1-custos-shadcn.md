# Fase 1: Shadcn UI, Temas e Motor de Custos com Economia de Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar o design system com Shadcn UI e temas Dark/Light/System (Tailwind v4 + next-themes) e implementar o motor de precificação de modelos com custo estimado e cálculo de economia por prompt caching.

**Architecture:** A aplicação receberá suporte a Tailwind v4 com CSS variables e `next-themes`. Componentes atômicos do shadcn serão criados em `src/components/ui/`. Um motor de precificação em `src/lib/pricing/` calculará custos em USD/BRL e economia de cache por evento e agregado, respeitando se o log possui custo nativo ou se deve usar estimativa. As configurações de preços e cotação de câmbio serão persistidas em `.local-data/settings.json`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, `next-themes`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `zod`, Node.js test runner (`tsx --test`), Playwright.

**Spec:** [`docs/superpowers/specs/2026-10-07-fase1-custos-shadcn-design.md`](file:///Users/icaroxenofonte/Documents/tokenusage/docs/superpowers/specs/2026-10-07-fase1-custos-shadcn-design.md)

## Global Constraints

- Nunca incluir históricos reais, métricas pessoais, credenciais ou arquivos de `.local-data` nos commits.
- O servidor local deve permanecer restrito a loopback (`127.0.0.1`).
- Preservar compatibilidade com testes existentes em `tests/parsers.test.ts`.
- Custos oficiais da fonte nunca devem ser sobrescritos por estimativas; a distinção entre Real e Estimado deve ser explícita.
- Respeitar fuso horário `America/Sao_Paulo` para agregações.

## Review Focus

1. Modelo desconhecido nos logs locais (ex.: modelo customizado): não deve quebrar o cálculo nem gerar custo incorreto; deve ser contabilizado como custo não-estimado mantendo a cobertura explícita.
2. Evento com cache zero: o cálculo de economia por cache deve retornar zero sem divisões por zero ou valores negativos.
3. Troca de tema entre Claro, Escuro e Sistema: não deve causar flickering ou renderizar cores ilegíveis em nenhum dos estados.
4. Input de cotação USD/BRL inválido ou zero: deve validar com Zod e manter valor de fallback seguro (5.75) sem quebrar o dashboard.
5. Reimportação de dados ou atualização de configurações de preço: deve refletir imediatamente nos cálculos sem exigir limpeza manual de cache de arquivo.

---

### Task 1: Setup do Tailwind CSS v4, Utilitários Shadcn e next-themes

**Files:**
- Modify: `package.json`
- Modify: `src/app/globals.css`
- Create: `src/lib/utils.ts`
- Create: `src/components/theme-provider.tsx`
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` em `src/lib/utils.ts`
- Produces: `<ThemeProvider>` e `<ThemeToggle>` para troca de tema Dark/Light/System

- [ ] **Step 1: Instalar dependências necessárias**

Execute:
```sh
npm install tailwindcss @tailwindcss/postcss next-themes clsx tailwind-merge class-variance-authority
```

- [ ] **Step 2: Criar utilitário `cn` em `src/lib/utils.ts`**

Implementar função helper padrão do shadcn combinando `clsx` e `tailwind-merge`.

- [ ] **Step 3: Configurar tokens de tema e Tailwind v4 em `src/app/globals.css`**

Importar `@import "tailwindcss";` e definir variáveis CSS de design tokens (`--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--muted`, `--border`, etc.) com paletas refinadas para `:root` e `.dark`.

- [ ] **Step 4: Criar `ThemeProvider` e `ThemeToggle`**

Criar provedor cliente usando `next-themes` com `attribute="class"`, `defaultTheme="system"` e `enableSystem`.
Criar botão `ThemeToggle` com opções Claro, Escuro e Sistema.

- [ ] **Step 5: Integrar `ThemeProvider` no `src/app/layout.tsx`**

Envolver o `children` com `<ThemeProvider>` e adicionar `suppressHydrationWarning` na tag `<html>`.

- [ ] **Step 6: Verificar compilação e tipagem**

Run: `npm run typecheck && npm run build`
Expected: Build concluído com sucesso.

- [ ] **Step 7: Commit**

```sh
git add package.json package-lock.json src/app/globals.css src/lib/utils.ts src/components/theme-provider.tsx src/components/theme-toggle.tsx src/app/layout.tsx
git commit -m "feat(ui): setup tailwind v4, next-themes and shadcn utils"
```

---

### Task 2: Componentes Base do Shadcn UI

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/tabs.tsx`

**Interfaces:**
- Produces: Componentes atômicos com variantes CVA, acessibilidade e suporte completo aos tokens de tema Dark/Light.

- [ ] **Step 1: Criar `src/components/ui/button.tsx`**

Implementar `Button` com variantes (`default`, `secondary`, `outline`, `ghost`, `destructive`) e tamanhos (`sm`, `md`, `lg`, `icon`).

- [ ] **Step 2: Criar `src/components/ui/card.tsx`**

Implementar `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

- [ ] **Step 3: Criar `src/components/ui/badge.tsx`**

Implementar `Badge` com variantes (`default`, `secondary`, `outline`, `success`, `warning`).

- [ ] **Step 4: Criar `src/components/ui/input.tsx` e `select.tsx`**

Implementar inputs estilizados com suporte a estados de foco, hover e dark mode.

- [ ] **Step 5: Criar `src/components/ui/tabs.tsx`**

Implementar `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` baseados em estado de navegação acessível.

- [ ] **Step 6: Verificar tipagem e build**

Run: `npm run typecheck`
Expected: 0 erros.

- [ ] **Step 7: Commit**

```sh
git add src/components/ui/
git commit -m "feat(ui): add core shadcn primitives (button, card, badge, input, select, tabs)"
```

---

### Task 3: Motor de Precificação, Fallbacks e Economia de Cache

**Files:**
- Create: `src/lib/pricing/types.ts`
- Create: `src/lib/pricing/defaults.ts`
- Create: `src/lib/pricing/calculator.ts`
- Create: `tests/pricing.test.ts`

**Interfaces:**
- Produces: `findModelPrice(model: string, customPrices?: Record<string, ModelPrice>): ModelPrice | null`
- Produces: `calculateEventCost(event: NormalizedEvent, pricing: PricingConfig): CalculatedEventCost`
- Produces: `calculateCacheSavings(events: NormalizedEvent[], pricing: PricingConfig): CacheSavings`

- [ ] **Step 1: Escrever teste de unidade que falha em `tests/pricing.test.ts`**

Cobrir:
- Resolução de modelo exato e por prefixo (`claude-3-7-sonnet-20250219` -> `claude-3-7-sonnet`).
- Cálculo de custo estimado quando evento não tem custo nativo.
- Preservação do custo nativo quando o evento já tem custo (ex.: Grok ou logs importados).
- Cálculo correto de economia de cache (tokens_cache * (preço_input - preço_cache)).
- Conversão monetária para BRL com taxa configurada.
- Modelo desconhecido retornando status não-estimado sem erros.

- [ ] **Step 2: Executar teste para verificar falha**

Run: `npx tsx --test tests/pricing.test.ts`
Expected: FAIL (módulos ainda não existem).

- [ ] **Step 3: Implementar tipos e defaults em `src/lib/pricing/`**

Criar `types.ts` com interfaces de preços (`inputPer1M`, `outputPer1M`, `cacheReadPer1M`).
Criar `defaults.ts` com tarifas oficiais da Anthropic (Claude 3.7/3.5 Sonnet, Haiku), OpenAI (GPT-4o, mini, o1, o3-mini), xAI (Grok 2, Grok 3) e Google (Gemini 1.5/2.0 Flash/Pro).

- [ ] **Step 4: Implementar calculadora em `src/lib/pricing/calculator.ts`**

Implementar `findModelPrice`, `calculateEventCost`, `calculateCacheSavings` e conversão USD/BRL.

- [ ] **Step 5: Executar testes para verificar aprovação**

Run: `npx tsx --test tests/pricing.test.ts`
Expected: PASS com 100% de sucesso.

- [ ] **Step 6: Commit**

```sh
git add src/lib/pricing/ tests/pricing.test.ts
git commit -m "feat(pricing): implement model pricing engine, cache savings and currency conversion"
```

---

### Task 4: Persistência de Configurações de Preços e Câmbio

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/local-store.ts`
- Modify: `src/app/api/settings/route.ts`

**Interfaces:**
- Consumes: `PricingConfig`, `ModelPrice` de `src/lib/pricing/types.ts`
- Produces: Suporte a `usdToBrlRate` e `customPricing` no schema do Zod e persistência em `.local-data/settings.json`.

- [ ] **Step 1: Atualizar schema e tipos em `src/lib/types.ts` e `src/lib/local-store.ts`**

Adicionar campos opcionais:
- `usdToBrlRate`: número positivo (padrão 5.75).
- `customPricing`: objeto chave-valor mapeando nome do modelo para tarifas por 1M tokens.

- [ ] **Step 2: Atualizar rota de API `src/app/api/settings/route.ts`**

Garantir validação segura no POST e retorno no GET, mantendo proteção de host local.

- [ ] **Step 3: Executar testes de regressão**

Run: `npm test`
Expected: Todos os 13 testes originais + testes de pricing passando.

- [ ] **Step 4: Commit**

```sh
git add src/lib/types.ts src/lib/local-store.ts src/app/api/settings/route.ts
git commit -m "feat(settings): support custom model prices and usd/brl rate in local settings"
```

---

### Task 5: Integração com Analytics e Agregações do Dashboard

**Files:**
- Modify: `src/lib/analytics.ts`
- Modify: `src/app/api/usage/route.ts`

**Interfaces:**
- Consumes: Calculadora de `src/lib/pricing/calculator.ts`
- Produces: Métricas estendidas no payload de `/api/usage`: `costEstimatedUSD`, `costRealUSD`, `costTotalEstimatedUSD`, `cacheSavingsUSD`, `cacheSavingsBRL`, `totalCostBRL`.

- [ ] **Step 1: Atualizar agregação em `src/lib/analytics.ts`**

Enriquecer os eventos e o resumo agregado com cálculo de custo estimado e economia por cache para cada evento e para o sumário geral.

- [ ] **Step 2: Atualizar rota `src/app/api/usage/route.ts`**

Carregar as configurações atuais de preço/câmbio antes de agregar os eventos e retornar os novos indicadores.

- [ ] **Step 3: Executar testes de unidade**

Run: `npm test`
Expected: Todos os testes passando sem erros.

- [ ] **Step 4: Commit**

```sh
git add src/lib/analytics.ts src/app/api/usage/route.ts
git commit -m "feat(analytics): integrate estimated cost and cache savings in usage payload"
```

---

### Task 6: Atualização da UI (Header, Overview, Settings e Componentes com Shadcn)

**Files:**
- Modify: `src/components/dashboard.tsx`
- Modify: `src/components/overview.tsx`
- Modify: `src/components/settings-panel.tsx`
- Modify: `src/components/activity-panel.tsx`
- Modify: `src/components/sources-panel.tsx`

**Interfaces:**
- Consumes: Novos componentes do shadcn em `src/components/ui/` e `ThemeToggle`.
- Produces: Interface moderna com alternância Dark/Light, Card de Economia de Cache, Breakdown de Custo Real vs Estimado em USD e BRL, e aba de Tabela de Preços nas Configurações.

- [ ] **Step 1: Adicionar `ThemeToggle` no cabeçalho em `src/components/dashboard.tsx`**

Integrar alternador de tema ao lado do status de atualização automática.

- [ ] **Step 2: Atualizar `src/components/overview.tsx` com componentes shadcn**

- Adicionar Card "Economia de Cache" com valor economizado em USD/BRL e percentual de economia.
- Atualizar Card de Custos mostrando o total estimado em BRL/USD com badge informativa e detalhe de custo real da fonte vs custo estimado por modelo.

- [ ] **Step 3: Atualizar `src/components/settings-panel.tsx`**

- Adicionar campo para cotação USD/BRL.
- Adicionar tabela interativa para visualizar e editar tarifas por modelo (input, output, cache por 1M).

- [ ] **Step 4: Refatorar tabelas e cards em `activity-panel.tsx` e `sources-panel.tsx` com shadcn**

Substituir elementos legados por `Card`, `Badge` e `Table` com compatibilidade nativa aos temas claro e escuro.

- [ ] **Step 5: Testar build e lint da aplicação**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: 0 erros, build de produção otimizado.

- [ ] **Step 6: Commit**

```sh
git add src/components/
git commit -m "feat(ui): modernize dashboard with shadcn components, theme toggle and pricing panels"
```

---

### Task 7: Testes End-to-End (Playwright) e Validação Visual

**Files:**
- Modify: `tests/browser/dashboard.spec.ts`

- [ ] **Step 1: Atualizar testes do Playwright**

Adicionar casos de teste para:
1. Alternar temas (Claro -> Escuro -> Sistema) e verificar se a classe `dark` é aplicada ao elemento `html`.
2. Verificar exibição do card de Economia de Cache e breakdown de custos estimados.
3. Testar alteração da cotação USD/BRL nas preferências e refletir nos valores exibidos.

- [ ] **Step 2: Executar bateria completa de testes**

Run: `npm test && npm run test:e2e`
Expected: 100% dos testes unitários e testes E2E aprovados.

- [ ] **Step 3: Commit**

```sh
git add tests/browser/dashboard.spec.ts
git commit -m "test(e2e): add browser tests for dark mode, cache savings and pricing settings"
```

---

### Task 8: Documentação e Pull Request

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Atualizar `README.md`**

Documentar os temas (Dark/Light), tabela de preços por modelo, cálculo de economia de cache e cotação USD/BRL.

- [ ] **Step 2: Commit e Push**

```sh
git add README.md
git commit -m "docs: update README with pricing engine, cache savings and shadcn theme guide"
git push origin feat/token-usage-dashboard
```
