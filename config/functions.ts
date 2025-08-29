// Functions mapping to tool calls
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function

export const get_weather = async ({
  location,
  unit,
}: {
  location: string;
  unit: string;
}) => {
  console.log("location", location);
  console.log("unit", unit);
  const res = await fetch(
    `/api/functions/get_weather?location=${location}&unit=${unit}`
  ).then((res) => res.json());

  console.log("executed get_weather function", res);

  return res;
};

export const functionsMap = {
  get_weather: get_weather
};

export const get_top_selling_products = async ({
  periodicidade,
  considerarFaturamento,
  dataInicial,
  dataFinal,
}: {
  periodicidade: string;
  considerarFaturamento: boolean;
  dataInicial?: string;
  dataFinal?: string;
}) => {
  const params = new URLSearchParams();
  if (periodicidade) params.set("periodicidade", periodicidade);
  if (typeof considerarFaturamento === "boolean")
    params.set("considerarFaturamento", String(considerarFaturamento));
  if (dataInicial) params.set("dataInicial", dataInicial);
  if (dataFinal) params.set("dataFinal", dataFinal);

  const url = `/api/functions/get_top_selling_products${params.toString() ? `?${params.toString()}` : ""
    }`;
  const res = await fetch(url).then((res) => res.json());
  return res;
};

// Append new function to map
Object.assign(functionsMap, { get_top_selling_products });

export const get_products_without_sales_since = async ({ since }: { since: string }) => {
  const res = await fetch(`/api/functions/get_products_without_sales_since?since=${encodeURIComponent(since)}`).then((res) => res.json());
  return res;
};

Object.assign(functionsMap, { get_products_without_sales_since });

export const request_date_input = async ({ prompt, placeholder }: { prompt?: string; placeholder?: string }) => {
  // This function does not call an API; it instructs the UI to render a date input request.
  // Returning a structured object to be displayed by the chat UI.
  return {
    type: "date_input_request",
    prompt: prompt || "Selecione uma data:",
    placeholder: placeholder || "YYYY-MM-DD",
  } as any;
};

Object.assign(functionsMap, { request_date_input });

export const get_weekly_sales_comparison = async ({
  period,
  metrics,
}: {
  period: string;
  metrics: string;
}) => {
  const params = new URLSearchParams({ period, metrics });
  const res = await fetch(`/api/functions/get_weekly_sales_comparison?${params.toString()}`).then((r) => r.json());
  return res;
};

Object.assign(functionsMap, { get_weekly_sales_comparison });

export const get_overdue_payables = async () => {
  const res = await fetch(`/api/functions/get_overdue_payables`).then((r) => r.json());
  return res;
};

Object.assign(functionsMap, { get_overdue_payables });

export const get_upcoming_payables_next_7_days = async () => {
  const res = await fetch(`/api/functions/get_upcoming_payables_next_7_days`).then((r) => r.json());
  return res;
};

Object.assign(functionsMap, { get_upcoming_payables_next_7_days });

export const get_birthdays_by_month = async ({ month }: { month: string }) => {
  const res = await fetch(`/api/functions/get_birthdays_by_month?month=${encodeURIComponent(month)}`).then((r) => r.json());
  return res;
};

Object.assign(functionsMap, { get_birthdays_by_month });

export const request_month_input = async ({ prompt, placeholder }: { prompt?: string; placeholder?: string }) => {
  return {
    type: "month_input_request",
    prompt: prompt || "Selecione um mês:",
    placeholder: placeholder || "YYYY-MM",
  } as any;
};

Object.assign(functionsMap, { request_month_input });

export const get_sales_details_by_product = async ({
  idProdutoEmpresa,
  nomeProduto,
  dataInicial,
  dataFinal,
  page,
  size,
}: {
  idProdutoEmpresa: string;
  nomeProduto?: string;
  dataInicial: string;
  dataFinal: string;
  page?: number;
  size?: number;
}) => {
  const params = new URLSearchParams({ idProdutoEmpresa, dataInicial, dataFinal });
  if (nomeProduto) params.set("nomeProduto", nomeProduto);
  if (typeof page === "number") params.set("page", String(page));
  if (typeof size === "number") params.set("size", String(size));
  const res = await fetch(`/api/functions/get_sales_details_by_product?${params.toString()}`).then((r) => r.json());
  return res;
};

Object.assign(functionsMap, { get_sales_details_by_product });