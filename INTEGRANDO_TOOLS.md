## Guia prático: como implementar uma nova Tool no Agente

Este guia descreve o passo a passo para expor uma nova tool para o modelo (function calling) e conectá-la a uma rota HTTP no Next.js. Siga na ordem e use a checklist no final.

### 1) Defina a tool em `config/tools-list.ts`

Cada tool precisa de um objeto com `name`, `description` e `parameters`. No runtime, todos os campos presentes em `parameters` são tratados como obrigatórios. Se algum parâmetro for conceitualmente opcional, forneça um valor padrão na rota ou no wrapper da função.

Exemplo de definição:

```typescript
{
  name: "get_weekly_sales_comparison",
  description:
    "Apresenta um comparativo de vendas por semana em um período e métricas selecionadas",
  parameters: {
    period: {
      type: "string",
      description:
        "Período a comparar: 'last_month', 'last_3_months' ou intervalo 'YYYY-MM-DD:YYYY-MM-DD'",
    },
    metrics: {
      type: "string",
      description:
        "Métricas separadas por vírgula: revenue,orders,avg_ticket (ex.: 'revenue,orders')",
    },
  },
}
```

Boas práticas:
- Use nomes em `name` que batem exatamente com: a) a função em `config/functions.ts` e b) a pasta da rota em `app/api/functions/<name>/route.ts`.
- Descreva os parâmetros com clareza. Se possível, use `enum` quando o domínio for fechado.

### 2) Crie a rota HTTP em `app/api/functions/<tool_name>/route.ts`

Crie uma rota (geralmente `GET`) que receba os parâmetros via query string, valide-os, execute a lógica/consulta externa e retorne JSON. Mantenha mensagens de erro claras e status adequados.

Template de rota (GET):

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 1) Leia parâmetros
    const requiredParam = searchParams.get("requiredParam");
    if (!requiredParam) {
      return new Response(
        JSON.stringify({ error: "Parâmetro 'requiredParam' é obrigatório" }),
        { status: 400 }
      );
    }

    // 2) Lógica principal (ex.: chamar API externa ou banco)
    // const data = await fetch("https://example.com/api?...", { ... }).then(r => r.json());

    // 3) Monte o payload de resposta
    const payload = { ok: true /*, data */ };

    return new Response(JSON.stringify(payload), { status: 200 });
  } catch (error) {
    console.error("[<tool_name>] erro:", error);
    return new Response(JSON.stringify({ error: "Falha ao processar a requisição" }), {
      status: 500,
    });
  }
}
```

Exemplo real (trecho) já existente no projeto (`get_weather`):

```12:60:app/api/functions/get_weather/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const unit = searchParams.get("unit");
    // ...
  } catch (error) {
    console.error("Error getting weather:", error);
    return new Response(JSON.stringify({ error: "Error getting weather" }), {
      status: 500,
    });
  }
}
```

### 3) Implemente o wrapper em `config/functions.ts`

O wrapper é a função que o agente executa quando o modelo chama a tool. Ela monta a URL da rota, faz o `fetch` e retorna o JSON. Depois, inclua esta função no `functionsMap` (usamos `Object.assign`).

Template de wrapper:

```typescript
export const minha_nova_tool = async ({
  foo,
  bar,
}: {
  foo: string;
  bar: number;
}) => {
  const params = new URLSearchParams();
  params.set("foo", foo);
  params.set("bar", String(bar));

  const res = await fetch(`/api/functions/minha_nova_tool?${params.toString()}`).then((r) => r.json());
  return res;
};

Object.assign(functionsMap, { minha_nova_tool });
```

Exemplo real já existente (`get_weather`):

```1:26:config/functions.ts
export const get_weather = async ({
  location,
  unit,
}: {
  location: string;
  unit: string;
}) => {
  const res = await fetch(
    `/api/functions/get_weather?location=${location}&unit=${unit}`
  ).then((res) => res.json());
  return res;
};

export const functionsMap = {
  get_weather: get_weather
};
```

Observações importantes:
- O `getTools()` marca como required todos os campos listados em `parameters`. Garanta que seu wrapper e sua rota lidem com isso (defaults quando aplicável).
- Para inputs de UI (ex.: `request_date_input`, `request_month_input`), o wrapper pode apenas retornar um objeto estruturado sem chamar API.

### 4) Teste rápido

- Navegue para a rota no browser: `http://localhost:3000/api/functions/<tool_name>?param1=...&param2=...` e verifique o JSON.
- Chame o wrapper no console da aplicação (ou via fluxo do chat) e valide o retorno.
- Verifique o console do servidor para logs de erro.

Exemplo (curl):

```bash
curl "http://localhost:3000/api/functions/get_weather?location=Sao%20Paulo&unit=celsius"
```

### 5) Checklist de PR

- [ ] `name` consistente entre `tools-list.ts`, `functions.ts` e a pasta da rota.
- [ ] Descrição clara e objetiva.
- [ ] Parâmetros necessários definidos e documentados (com `enum` quando fizer sentido).
- [ ] Rota criada em `app/api/functions/<name>/route.ts` com validação, tratamento de erros e resposta JSON.
- [ ] Wrapper criado em `config/functions.ts` e registrado em `functionsMap`.
- [ ] Testes manuais feitos (rota e wrapper), incluindo casos de erro (400/500).

### Troubleshooting

- Nome divergente: Se `name` em `tools-list.ts` não bater com o wrapper e a rota, o modelo chamará uma função inexistente.
- Parâmetros ausentes: Como todos os parâmetros em `parameters` são considerados required, chamadas sem todos os campos podem não ser geradas pelo modelo. Se algo for opcional, trate no wrapper/rota com valores padrão.
- 404/500 na rota: Confira o caminho `app/api/functions/<name>/route.ts`, a leitura de parâmetros e erros de upstream. Logue com `console.error` para rastrear.
- Resposta incompatível: Sempre retorne JSON serializável. Evite retornar estruturas gigantes sem necessidade.

### Exemplo completo (fictício): `get_currency_rate`

1) `config/tools-list.ts`

```typescript
{
  name: "get_currency_rate",
  description: "Obtém a cotação de uma moeda base para outra (ex.: BRL -> USD)",
  parameters: {
    base: { type: "string", description: "Moeda base (ex.: BRL)" },
    target: { type: "string", description: "Moeda alvo (ex.: USD)" },
  },
}
```

2) `app/api/functions/get_currency_rate/route.ts`

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get("base");
    const target = searchParams.get("target");

    if (!base || !target) {
      return new Response(
        JSON.stringify({ error: "Parâmetros 'base' e 'target' são obrigatórios" }),
        { status: 400 }
      );
    }

    // Exemplo usando uma API pública fictícia
    // const data = await fetch(`https://example.com/rates?base=${base}&target=${target}`).then(r => r.json());
    const data = { rate: 5.23 }; // mock

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("[get_currency_rate] erro:", error);
    return new Response(JSON.stringify({ error: "Falha ao obter cotação" }), {
      status: 500,
    });
  }
}
```

3) `config/functions.ts`

```typescript
export const get_currency_rate = async ({ base, target }: { base: string; target: string }) => {
  const params = new URLSearchParams({ base, target });
  const res = await fetch(`/api/functions/get_currency_rate?${params.toString()}`).then((r) => r.json());
  return res;
};

Object.assign(functionsMap, { get_currency_rate });
```

Pronto! Seguindo estes passos a tool fica disponível para o modelo usar via function calling, com fluxo consistente no app.