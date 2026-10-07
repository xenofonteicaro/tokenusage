# Tokenusage — dashboard pessoal

## Objetivo e decisões

O usuário quer acompanhar Grok, Codex, Claude e Gemini, tanto em ferramentas
por assinatura quanto em chamadas de API. Após confirmar que não tem acesso
às APIs administrativas, pediu coleta pelo perfil local da máquina.

A primeira entrega lê métricas reais locais. Entre aplicação local, aplicação
hospedada com um agente de sincronização e proxy de chamadas, escolhemos a
aplicação local: aproveita o histórico existente, dispensa credenciais e não
exige mudar a forma de usar as ferramentas. Hospedagem requer outro trabalho
para coleta e autenticação. Um proxy não recuperaria o histórico.

## Fontes e limites

- Codex: sessões JSONL ativas e arquivadas. Calcular deltas dos contadores
  cumulativos, ignorar snapshots repetidos e manter modelo/projeto por turno.
- Claude Code: mensagens de assistente com `message.usage`; deduplicar pelo ID
  de mensagem e conservar o snapshot com maior consumo, incluindo cache.
- Grok Build: `usage.json` por sessão/turno e `summary.json` apenas para
  metadados. Input da ledger já inclui cache. Reasoning é subconjunto de
  output. Custos em ticks usam 10^10 ticks por USD e são valores registrados
  pela ferramenta, não uma fatura completa da assinatura.
- Gemini CLI: sessões JSON/JSONL com `tokens`; cache é subconjunto de input,
  thoughts fazem parte do output normalizado. Os logs antigos sem tokens
  encontrados nesta máquina não permitem recuperar consumo exato.
- API: importação de logs JSON/JSONL com uso por chamada (incluindo formatos
  OpenAI/xAI, Anthropic e Gemini). Sem credenciais, não é possível obter
  automaticamente consumo remoto que nunca foi registrado localmente.

Não ler cookies, credenciais, prompts ou respostas para exibição. Extrair
apenas datas, nomes de projeto/modelo, contadores e custos quando informados.
Não apresentar ausência de informação como zero consumo ou zero custo.

## Produto

Interface em português, visual claro com navegação em grafite e acento verde.
Visão geral: tokens, proporção de cache, sessões, custo informado e cobertura;
série diária por serviço, participação por serviço, ranking por modelo/projeto.
Atividade: sessões pesquisáveis com tokens/cache e datas. Fontes: diagnóstico
do histórico e importação de logs. Preferências: mensalidades em BRL e meta
mensal de tokens, guardadas localmente. Exportação CSV respeita filtros.

Ferramentas e APIs são vistas separadas: somá-las pode duplicar chamadas de
CLIs autenticados por API. Dias são agrupados no fuso America/Sao_Paulo,
com limites de período inclusivos. Histórico consultável de até 90 dias.

## Arquitetura e dados

Next.js App Router / Node.js, coletores isolados, normalização tipada e
agregação compartilhada. Endpoints locais retornam apenas dados normalizados.
Cache por arquivo/mtime evita reler arquivos inalterados. Leitura em streaming,
concorrência limitada, diretórios específicos, sem seguir links simbólicos.
Arquivos de métricas importadas e preferências ficam em `.local-data` ignorado
pelo Git. Gravações serializadas e atômicas. Servidor ligado em 127.0.0.1;
validar Host/Origin antes de consultar ou alterar dados pessoais.

## Validação

Testes dos contadores cumulativos, streaming duplicado, cache/reasoning,
importação repetida, fuso, períodos, dados ausentes e origem de requisições.
Build, lint, typecheck, coleta real e testes no navegador desktop/mobile.
Commit, push e PR conforme instrução do usuário. Não realizar merge.
