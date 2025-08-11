## MVP Chatbot — SIFAT Sistemas

Assistente conversacional para gestores do ERP SIFAT, com execução de ferramentas (funções) para consultar e analisar dados operacionais. Construído em Next.js (App Router) e integrado à OpenAI Responses API com streaming.

### Visão geral

- **Objetivo**: entregar respostas em português, claras e acionáveis, usando funções para buscar dados e renderizar resultados na UI (tabelas, cartões, listas), enquanto o assistente contextualiza e destaca insights.
- **Fluxo**: o frontend envia mensagens e a lista de ferramentas → a API `/api/turn_response` orquestra a chamada `responses.create` (OpenAI) com streaming SSE → eventos são processados em `lib/assistant.ts` → se houver chamada de função, o frontend executa a função mapeada e exibe os resultados.
- **Estado**: `zustand` gerencia conversa e configurações de ferramentas.

### Tech stack

- Next.js 15 (App Router) + React 18 + TypeScript
- Tailwind CSS + Radix UI
- Zustand para estado global
- OpenAI SDK (Responses API, streaming SSE)

### Estrutura do projeto (essencial)

- `app/api/turn_response/route.ts`: endpoint SSE que chama a OpenAI Responses API e transmite eventos.
- `lib/assistant.ts`: loop de processamento de eventos do streaming; orquestra tool calls e atualização da conversa.
- `config/constants.ts`: modelo (`MODEL`), prompt do desenvolvedor (`DEVELOPER_PROMPT`) e toggles padrão de ferramentas.
- `config/tools-list.ts`: catálogo das ferramentas expostas ao modelo (nome, descrição, parâmetros).
- `config/functions.ts`: implementação cliente das funções (chamam rotas em `app/api/functions/...`).
- `lib/tools/tools.ts`: monta a lista de ferramentas ativas conforme os toggles do store.
- `lib/tools/tools-handling.ts`: dispatcher que executa a função correta via `functionsMap`.
- `stores/`: stores da conversa e das ferramentas (zustand, com persistência onde aplicável).
- `components/`: chat, rendering de tool calls, inputs de data/mês, etc.

### Pré‑requisitos

- Node.js 20+ (recomendado 20.11 ou superior)
- Chave da OpenAI: `OPENAI_API_KEY`

### Configuração

1) Crie um arquivo `.env.local` na raiz do projeto com sua chave:

```
OPENAI_API_KEY=sk-...
```

2) Instale dependências:

```
npm install
```

3) Inicie o ambiente de desenvolvimento:

```
npm run dev
```

Aplicação disponível em `http://localhost:3000`.

### Como funciona (fluxo de alto nível)

1) O usuário envia uma mensagem no chat (`components/assistant.tsx` → `lib/assistant.processMessages`).
2) O frontend chama `/api/turn_response` com mensagens e ferramentas ativas (`lib/tools/getTools`).
3) A Responses API envia eventos via SSE; o cliente atualiza a UI incrementalmente.
4) Quando o modelo solicita uma função (tool call), o cliente:
   - Parseia os argumentos (streaming)
   - Executa a função mapeada em `config/functions.ts`
   - Envia a saída como `function_call_output` e produz uma nova rodada de inferência
5) A UI exibe dados em componentes dedicados (tabelas/cartões) e o assistente escreve apenas o contexto/insights.

### Ferramentas disponíveis (exemplos)

As ferramentas são descritas em `config/tools-list.ts` e implementadas/encaminhadas em `config/functions.ts` para rotas em `app/api/functions/...`.

- `get_top_selling_products()`: top 10 produtos mais vendidos
- `get_products_without_sales_since(since: YYYY-MM-DD)`: produtos sem venda desde a data
- `get_weekly_sales_comparison(period, metrics)`: comparação semanal (períodos e métricas)
- `get_overdue_payables()`: títulos a pagar vencidos
- `get_upcoming_payables_next_7_days()`: títulos a vencer em 7 dias
- `get_birthdays_by_month(month)`: aniversariantes por mês
- Demos: `get_weather(location, unit)`, `get_joke()`

Inputs especiais (renderizados na UI):

- `request_date_input(prompt?, placeholder?)`: solicita uma data do usuário
- `request_month_input(prompt?, placeholder?)`: solicita um mês do usuário

### Adicionando novas ferramentas

1) Crie a rota de API em `app/api/functions/<nome_da_funcao>/route.ts` que retorna JSON.
2) Em `config/functions.ts`:
   - Implemente uma função async que faça `fetch` para a rota acima
   - Adicione ao `functionsMap` (export default já é incremental via `Object.assign` no arquivo)
3) Em `config/tools-list.ts`:
   - Adicione um item com `name`, `description` e `parameters`
4) Se precisar de UI customizada para exibir resultados, crie um componente em `components/` e trate em `components/chat.tsx` quando o item correspondente aparecer no fluxo.

### Personalização do assistente

- `config/constants.ts`:
  - `MODEL`: modelo usado na Responses API (padrão: `gpt-4.1`)
  - `DEVELOPER_PROMPT`: diretrizes de escrita/estilo e uso de ferramentas
  - Toggles de ferramentas: `FILE_SEARCH_ENABLED`, `WEB_SEARCH_ENABLED`, `FUNCTIONS_ENABLED`, `CODE_INTERPRETER_ENABLED`, `MCP_ENABLED`

### Scripts

```
npm run dev    # desenvolvimento
npm run build  # build de produção
npm run start  # iniciar servidor de produção
npm run lint   # checagens de lint
```

### Deploy

- Configure `OPENAI_API_KEY` nas variáveis de ambiente da plataforma (ex.: Vercel)
- Faça build e start padrão do Next.js (App Router)

### Dicas de uso (prompts)

- “Liste os 10 produtos mais vendidos.”
- “Liste os produtos sem vendas desde 2024-09-01.”
- “Apresente um comparativo de vendas por semana para o último mês, métricas: revenue,orders.”
- “Liste os títulos a pagar vencidos.”
- “Liste os títulos a pagar com vencimento nos próximos 7 dias.”
- “Liste os clientes que fazem aniversário no mês de julho.”

### Segurança e privacidade

- A chave `OPENAI_API_KEY` é lida apenas no backend (Next.js API). Não commitá-la no repositório.
- O store de ferramentas usa persistência local (localStorage) para preferências.

### Licença

Consulte o arquivo `LICENSE` na raiz do projeto.


