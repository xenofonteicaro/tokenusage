---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/overview.tsx","src/components/dashboard.tsx"]
---

# Visão geral (redesign claro + escuro)

Mode: Operate. Surface: dashboard principal do tokenusage (src/app/page.tsx e componentes do dashboard). Mockup aprovado antes de mudar o app: mockups/visao-geral.tsx e mockups/png/.

Audience/job: pessoa dev brasileira, uso pessoal local; olhada rápida diária em tokens, custo USD/BRL e economia de cache. Constraints: lacuna nunca como zero, Ferramentas e APIs separadas, dois temas com o mesmo cuidado, mobile responsivo.

Chosen direction: padrão da categoria (shadcn/ui, preset base-nova, cor base neutral), escolhido pelo usuário depois de rejeitar a direção Azulejo de Brasília por ser vibrante demais. Referência: bloco dashboard-01 do shadcn.
Unresolved: migrar o app para componentes shadcn base-nova (hoje são componentes próprios) ou só os tokens.

## Direction contract

THESIS: Painel shadcn padrão executado com rigor: neutro, legível, sem ornamento. Recusa cores vibrantes e qualquer mundo visual próprio.
OWN-WORLD: Tokens neutral do shadcn (oklch sem croma), Geist, raio 0.625rem, Card/Badge outline/Progress/Table/Alert/ToggleGroup padrão; gráfico de área com var(--primary) e degradê suave; nenhuma cor de destaque além do primário.
STORY: Quem abre vê em segundos tokens, custo (com cobertura de tarifa), economia e aproveitamento de cache; lacunas aparecem como tal.
FIRST VIEWPORT: Sidebar inset à esquerda (navegação + ferramentas com total), header com título, tema, Atualizar e Exportar CSV; abas Ferramentas/APIs e filtros; quatro cards de resumo; gráfico de área diário com seletor 90/30/7 dias.
FORM: canon (padrão da categoria), escolhido pelo usuário; seed c49cb29d.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
