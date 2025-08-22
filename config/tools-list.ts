// List of tools available to the assistant
// No need to include the top-level wrapper object as it is added in lib/tools/tools.ts
// More information on function calling: https://platform.openai.com/docs/guides/function-calling

export const toolsList = [
  {
    name: "get_weather",
    description: "Get the weather for a given location",
    parameters: {
      location: {
        type: "string",
        description: "Location to get weather for",
      },
      unit: {
        type: "string",
        description: "Unit to get weather in",
        enum: ["celsius", "fahrenheit"],
      },
    },
  },
  {
    name: "get_sales_details_by_product",
    description: "Consulta notas de venda de um produto em um período e retorna campos relevantes para análise de horários. Lembre-se, datas relativas como 'HOJE', 'ONTEM', 'ULTIMOS_7_DIAS', 'ULTIMOS_15_DIAS', 'ULTIMOS_30_DIAS', 'ULTIMOS_60_DIAS', 'ULTIMOS_90_DIAS' são consideradas a partir do dia atual.",
    parameters: {
      idProdutoEmpresa: {
        type: "string",
        description: "ID do produto na empresa (idProdutoEmpresa)",
      },
      nomeProduto: {
        type: "string",
        description: "Nome do produto (preenchido pelo bot para exibição)",
      },
      dataInicial: {
        type: "string",
        description: "Data inicial no formato YYYY-MM-DD",
      },
      dataFinal: {
        type: "string",
        description: "Data final no formato YYYY-MM-DD",
      },
      page: {
        type: "number",
        description: "Página (opcional, default 0)",
      },
      size: {
        type: "number",
        description: "Tamanho da página (opcional, default 200)",
      },
    },
  },
  {
    name: "get_joke",
    description: "Get a programming joke",
    parameters: {},
  },
  {
    name: "get_top_selling_products",
    description: "Retorna os 10 produtos mais vendidos",
    parameters: {
      periodicidade: {
        type: "string",
        description:
          "Periodicidade do relatório (CUSTOMIZADO exige datas)",
        enum: [
          "HOJE",
          "ONTEM",
          "ULTIMOS_7_DIAS",
          "ULTIMOS_15_DIAS",
          "ULTIMOS_30_DIAS",
          "ULTIMOS_60_DIAS",
          "ULTIMOS_90_DIAS",
          "CUSTOMIZADO",
        ],
      },
      considerarFaturamento: {
        type: "boolean",
        description: "Se true, considerar faturamento no ranking. Padrão: true.",
      },
    },
  },
  {
    name: "get_products_without_sales_since",
    description: "Lista produtos sem vendas desde uma data específica",
    parameters: {
      since: {
        type: "string",
        description: "Data inicial (YYYY-MM-DD) para verificar ausência de vendas",
      },
    },
  },
  {
    name: "request_date_input",
    description: "Solicita ao usuário a seleção de uma data via um input de data",
    parameters: {
      prompt: {
        type: "string",
        description: "Mensagem/rotulo para orientar a seleção da data",
      },
      placeholder: {
        type: "string",
        description: "Texto de placeholder opcional para o campo de data",
      },
    },
  },
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
  },
  {
    name: "get_overdue_payables",
    description: "Lista os títulos a pagar vencidos",
    parameters: {},
  },
  {
    name: "get_upcoming_payables_next_7_days",
    description: "Lista os títulos a pagar com vencimento nos próximos 7 dias",
    parameters: {},
  },
  {
    name: "get_birthdays_by_month",
    description: "Lista os clientes que fazem aniversário no mês informado",
    parameters: {
      month: {
        type: "string",
        description: "Mês para busca (1-12 ou nome do mês em pt-BR, ex.: 'julho')",
      },
    },
  },
  {
    name: "request_month_input",
    description: "Solicita ao usuário a seleção de um mês (input de mês)",
    parameters: {
      prompt: {
        type: "string",
        description: "Mensagem/rotulo para orientar a seleção do mês",
      },
      placeholder: {
        type: "string",
        description: "Texto de placeholder opcional (ex.: 2025-07)",
      },
    },
  },
];
