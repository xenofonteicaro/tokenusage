# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Uma pessoa desenvolvedora (uso pessoal, confirmado) que usa Codex, Claude Code, Grok Build e Gemini CLI no próprio computador. Abre o painel para uma olhada rápida e recorrente no consumo de tokens, no custo em USD/BRL e na economia de cache, sem enviar nada para a nuvem.

## Product Purpose
Dashboard local, em português, que lê o histórico preservado das ferramentas de IA no perfil da máquina (até 90 dias) e aceita logs de chamadas de API em JSON/JSONL, sem chaves administrativas. Sucesso: a pessoa entende em segundos quanto consumiu, quanto isso custa e quanto o cache economizou, e confia que os números não escondem lacunas.

## Positioning
Coleta 100% local pelo perfil da máquina, sem credenciais, sem ler prompts ou respostas, e com honestidade sobre o que falta: registros sem tarifa ou sem contadores aparecem como lacuna, nunca como zero.

## Operating Context
Roda em 127.0.0.1 (Next.js), também instalável pelo Homebrew como serviço do macOS. Atualiza a cada minuto com a aba visível. Dias agrupados em America/Sao_Paulo. Ferramentas (sessões locais) e APIs (logs importados) são visões separadas, porque somá-las pode contar a mesma chamada duas vezes.

## Capabilities and Constraints
- Quatro fontes automáticas (Codex, Claude Code, Grok Build, Gemini CLI) e importação de logs de API com deduplicação.
- Filtros por serviço, modelo, projeto e período; série diária, comparação com o período anterior, participação por serviço, ranking por modelo e projeto.
- Custos em USD e BRL: valores informados pelos logs, estimativas por tarifa editável e cobertura explícita dos registros sem tarifa. Economia de cache, mensalidades em BRL e meta mensal de tokens.
- Abas: Visão geral, Atividade, Fontes de dados, Preferências. Exportação CSV respeitando filtros. Temas Claro, Escuro e Sistema, interface responsiva, abas navegáveis por teclado.
- Stack existente: Next.js App Router, React, Tailwind 4, componentes shadcn, next-themes, lucide-react.
- Limites a respeitar: histórico de até 90 dias; Gemini sem contadores não gera métricas; ausência de dado nunca é exibida como zero.

## Brand Commitments
Nome "tokenusage" e interface em português do Brasil. Os dois temas (claro e escuro) são requisito do produto.
Visual definido pelo usuário (07/10/2026): shadcn/ui padrão, simples, tema neutro e cores pouco saturadas. Direções experimentais ou vibrantes foram rejeitadas.

## Evidence on Hand
Capturas com dados sintéticos em `docs/screenshots/` (visão geral clara e escura, preferências/tarifas, mobile). Não existem depoimentos, clientes ou métricas reais para exibir; qualquer número de demonstração deve ser rotulado como sintético.

## Product Principles
- Confiança antes de brilho: todo número mostra de onde vem e o que não cobre.
- Privacidade é a premissa: nada sai da máquina, nada de conteúdo de conversa.
- Lacuna é informação: dado ausente aparece como ausente, nunca como zero.
- Uma olhada responde a pergunta do dia: consumo, custo e economia de cache primeiro.
- Os dois temas têm o mesmo nível de cuidado, nenhum é derivado do outro.

## Accessibility & Inclusion
Navegação por teclado nas abas e controles; legibilidade nos dois temas e no mobile.
