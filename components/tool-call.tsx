import React from "react";

import { ToolCallItem } from "@/lib/assistant";
import { BookOpenText, Clock, Globe, Zap, Code2, Download, AlertTriangle, CalendarX, Gift } from "lucide-react";
import useConversationStore from "@/stores/useConversationStore";
import { processMessages } from "@/lib/assistant";
import DateInput from "./date-input";
import MonthInput from "./month-input";
import TopProductsTable from "./top-products-table";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

interface ToolCallProps {
  toolCall: ToolCallItem;
}

function ApiCallCell({ toolCall }: ToolCallProps) {
  const { addConversationItem, addChatMessage, setAssistantLoading } =
    useConversationStore();

  const sendUserMessage = async (text: string) => {
    const userItem: any = {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text }],
    };
    const userMessage: any = { role: "user", content: text };
    try {
      setAssistantLoading(true);
      addConversationItem(userMessage);
      addChatMessage(userItem);
      await processMessages();
    } catch (e) {
      console.error("Error sending message:", e);
    }
  };
  // Special rendering for top selling products: render exactly API fields
  if (toolCall.name === "get_top_selling_products" && toolCall.output) {
    try {
      const parsed = JSON.parse(toolCall.output);
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      const currency = parsed?.currency || "BRL";
      const fmt = (v: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(v);
      return (
        <div className="w-full overflow-x-auto rounded-2xl border border-[#0f67b2]/20 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#0f67b2]/5 text-stone-700">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Produto</th>
                <th className="px-4 py-3 text-right font-medium">Quantidade</th>
                <th className="px-4 py-3 text-right font-medium">Faturamento</th>
                <th className="px-4 py-3 text-right font-medium">Custo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p: any, idx: number) => (
                <tr
                  key={`${p.produto}-${idx}`}
                  className={idx % 2 === 0 ? "bg-white" : "bg-stone-50"}
                >
                  <td className="px-4 py-3 text-stone-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">{p.produto}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                    {Number(p.quantidade || 0).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-700" title={String(p.faturamento)}>
                    {fmt(Number(p.faturamento || 0))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-700" title={String(p.custo)}>
                    {fmt(Number(p.custo || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch {
      // fallthrough to default rendering if parsing fails
    }
  }

  // Special rendering for sales details by product
  if (toolCall.name === "get_sales_details_by_product") {
    const args = (() => {
      try {
        return toolCall.parsedArguments || (toolCall.arguments ? JSON.parse(toolCall.arguments) : {});
      } catch {
        return {};
      }
    })();
    const fmtDatePretty = (isoYYYYMMDD?: string) => {
      if (!isoYYYYMMDD) return "—";
      try {
        const d = new Date(`${isoYYYYMMDD}T00:00:00Z`);
        const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(d);
        const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
        const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
        return `${date} (${cap(weekday)})`;
      } catch {
        return isoYYYYMMDD;
      }
    };
    const renderSummary = (peakHours?: Array<{ hour: string; count: number }>) => (
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-stone-500 text-xs">Produto</div>
          <div className="text-stone-900 font-semibold">
            {args?.idProdutoEmpresa || "—"}
            {args?.nomeProduto ? <span className="text-stone-600 font-normal"> • {args.nomeProduto}</span> : null}
          </div>
        </div>
        <div>
          <div className="text-stone-500 text-xs">Período</div>
          <div className="text-stone-800">
            {fmtDatePretty(args?.dataInicial)}
            <span className="text-stone-400"> — </span>
            {fmtDatePretty(args?.dataFinal)}
          </div>
        </div>
        {Array.isArray(peakHours) && peakHours.length > 0 && (
          <div>
            <div className="text-stone-500 text-xs mb-1">Horários de pico</div>
            <div className="flex flex-wrap gap-2">
              {peakHours.map((h) => (
                <span key={h.hour} className="inline-flex items-center gap-1 rounded-full bg-[#0f67b2]/10 text-[#0f67b2] px-2.5 py-0.5 text-xs">
                  <span className="font-medium">{h.hour}h</span>
                  <span className="text-stone-500">({h.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    if (!toolCall.output) {
      return (
        <div className="w-full rounded-2xl border border-[#0f67b2]/20 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-stone-800 font-medium">Vendas por produto</div>
            <div className="inline-flex items-center gap-2 text-stone-500 text-xs"><Clock size={14} className="animate-pulse" /> Carregando...</div>
          </div>
          <div className="mt-3">{renderSummary([])}</div>
        </div>
      );
    }

    try {
      const parsed = JSON.parse(toolCall.output);
      const hourlyHistogram: Array<{ hour: string; count: number }> = Array.isArray(parsed?.hourlyHistogram) ? parsed.hourlyHistogram : [];
      const peakHours: Array<{ hour: string; count: number }> = Array.isArray(parsed?.peakHours) ? parsed.peakHours : [];
      const totalElements: number = parsed?.totalElements ?? 0;
      const chartData = hourlyHistogram.map((b) => ({ hour: `${b.hour}h`, count: b.count || 0 }));
      const height = 260;

      const SalesTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || payload.length === 0) return null;
        const value = Number(payload[0].value || 0);
        return (
          <div className="rounded-md bg-white px-3 py-2 text-xs shadow-lg border border-stone-200">
            <div className="text-stone-500 mb-0.5">Horário</div>
            <div className="text-stone-900 font-semibold mb-1">{label}</div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#0f67b2]"></span>
              <div className="text-stone-700">
                {value} venda{value === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        );
      };

      return (
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#0f67b2]/20 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-stone-800 font-medium">Resumo</div>
                <div className="text-xs text-stone-500">{totalElements} registros</div>
              </div>
              <div className="mt-3">{renderSummary(peakHours)}</div>
            </div>
            <div className="md:col-span-2 rounded-2xl border border-[#0f67b2]/20 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-stone-800 font-medium">Distribuição por hora</div>
              </div>
              <div className="mt-2 overflow-x-auto relative">
                {hourlyHistogram.length > 0 ? (
                  <ResponsiveContainer width="100%" height={height}>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hour"
                        interval={0}
                        tickFormatter={(value: any, index: number) => (index % 2 === 0 ? value : "")}
                        tick={{ fontSize: 12, fontWeight: 600, fill: "#374151" }}
                        dy={6}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} width={36} />
                      <Tooltip content={<SalesTooltip />} cursor={{ stroke: '#0f67b2', strokeOpacity: 0.12 }} />
                      <Line type="monotone" dataKey="count" stroke="#0f67b2" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-stone-500">Sem dados para o período informado.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } catch {
      // fallthrough to default rendering on parse error
    }
  }

  // Special rendering for products without sales since: responsive table
  if (
    toolCall.name === "get_products_without_sales_since" &&
    toolCall.output
  ) {
    try {
      const parsed = JSON.parse(toolCall.output);
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      return (
        <div className="w-full overflow-x-auto rounded-2xl border border-[#0f67b2]/20 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#0f67b2]/5 text-stone-700">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Produto</th>
                <th className="px-4 py-3 text-left font-medium">Código</th>
                <th className="px-4 py-3 text-left font-medium">Última venda</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p: any, idx: number) => (
                <tr
                  key={p.product_id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-stone-50"}
                >
                  <td className="px-4 py-3 text-stone-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">{p.name}</td>
                  <td className="px-4 py-3 text-stone-600">{p.product_id}</td>
                  <td className="px-4 py-3 text-stone-700">
                    {p.last_sale_date ? p.last_sale_date : "Sem registro"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch {
      // fallthrough
    }
  }

  // Special rendering for weekly sales comparison
  if (toolCall.name === "get_weekly_sales_comparison" && toolCall.output) {
    try {
      const parsed = JSON.parse(toolCall.output);
      const weeks = Array.isArray(parsed?.weeks) ? parsed.weeks : [];
      const metrics: string[] = Array.isArray(parsed?.metrics)
        ? parsed.metrics
        : [];
      const currency = parsed?.currency || "BRL";
      const fmt = (v: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
          v
        );

      return (
        <div className="w-full overflow-x-auto rounded-2xl border border-[#0f67b2]/20 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#0f67b2]/5 text-stone-700">
                <th className="px-4 py-3 text-left font-medium">Semana</th>
                <th className="px-4 py-3 text-left font-medium">Início</th>
                <th className="px-4 py-3 text-left font-medium">Fim</th>
                {metrics.includes("revenue") && (
                  <th className="px-4 py-3 text-right font-medium">Faturamento</th>
                )}
                {metrics.includes("orders") && (
                  <th className="px-4 py-3 text-right font-medium">Pedidos</th>
                )}
                {metrics.includes("avg_ticket") && (
                  <th className="px-4 py-3 text-right font-medium">Ticket Médio</th>
                )}
              </tr>
            </thead>
            <tbody>
              {weeks.map((w: any, idx: number) => (
                <tr
                  key={w.week}
                  className={idx % 2 === 0 ? "bg-white" : "bg-stone-50"}
                >
                  <td className="px-4 py-3 text-stone-800 font-medium">{w.week}</td>
                  <td className="px-4 py-3 text-stone-700">{w.start}</td>
                  <td className="px-4 py-3 text-stone-700">{w.end}</td>
                  {metrics.includes("revenue") && (
                    <td className="px-4 py-3 text-right tabular-nums text-stone-700" title={String(w.revenue)}>
                      {fmt(Number(w.revenue || 0))}
                    </td>
                  )}
                  {metrics.includes("orders") && (
                    <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                      {Number(w.orders || 0).toLocaleString("pt-BR")}
                    </td>
                  )}
                  {metrics.includes("avg_ticket") && (
                    <td className="px-4 py-3 text-right tabular-nums text-stone-700" title={String(w.avg_ticket)}>
                      {fmt(Number(w.avg_ticket || 0))}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch {
      // fallthrough
    }
  }

  // Special rendering for overdue payables
  if (toolCall.name === "get_overdue_payables" && toolCall.output) {
    try {
      const parsed = JSON.parse(toolCall.output);
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      const currency = parsed?.currency || "BRL";
      const fmt = (v: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
          v
        );
      const asOf: string | undefined = parsed?.as_of;
      const asOfDate = asOf ? new Date(`${asOf}T00:00:00Z`) : new Date();
      const daysBetween = (d1: Date, d2: Date) => Math.max(0, Math.floor((+d1 - +d2) / (1000 * 60 * 60 * 24)));

      return (
        <div className="w-full space-y-2">
          {items.map((t: any) => {
            const due = t.due_date ? new Date(`${t.due_date}T00:00:00Z`) : null;
            const overdueDays = due ? daysBetween(asOfDate, due) : undefined;
            return (
              <div
                key={t.title_id}
                className="flex items-center justify-between gap-4 rounded-3xl border border-red-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-stone-900 font-medium truncate">{t.title_id} • {t.supplier}</div>
                    <div className="flex items-center gap-2 text-xs text-stone-600">
                      <span className="inline-flex items-center gap-1"><CalendarX size={14} /> Venc.: {t.due_date || "—"}</span>
                      {typeof overdueDays === "number" && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">({overdueDays} dias em atraso)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-stone-900 font-semibold tabular-nums">{fmt(Number(t.amount || 0))}</div>
                  <div className="text-xs inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-700 mt-1">Vencido</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch {
      // fallthrough
    }
  }

  // Special rendering for upcoming payables (next 7 days)
  if (toolCall.name === "get_upcoming_payables_next_7_days" && toolCall.output) {
    try {
      const parsed = JSON.parse(toolCall.output);
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      const currency = parsed?.currency || "BRL";
      const fmt = (v: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
          v
        );
      return (
        <div className="w-full space-y-2">
          {items.map((t: any) => (
            <div
              key={t.title_id}
              className="flex items-center justify-between gap-4 rounded-3xl border border-amber-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Clock size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-stone-900 font-medium truncate">{t.title_id} • {t.supplier}</div>
                  <div className="text-xs text-stone-600">Vencimento: {t.due_date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-stone-900 font-semibold tabular-nums">{fmt(Number(t.amount || 0))}</div>
                <div className="text-xs inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 mt-1">A vencer</div>
              </div>
            </div>
          ))}
        </div>
      );
    } catch {
      // fallthrough
    }
  }

  // Special rendering for birthdays by month
  if (toolCall.name === "get_birthdays_by_month" && toolCall.output) {
    try {
      const parsed = JSON.parse(toolCall.output);
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      const formatPtBrLong = (isoDate: string) =>
        new Intl.DateTimeFormat("pt-BR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(`${isoDate}T00:00:00Z`));

      const daysUntilBirthday = (isoBirthDate: string) => {
        const today = new Date();
        const todayUTC = new Date(
          Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
        );
        const [m, d] = isoBirthDate.split("-").map(Number);
        let next = new Date(Date.UTC(today.getFullYear(), (m || 1) - 1, d || 1));
        if (next < todayUTC) {
          next = new Date(Date.UTC(today.getFullYear() + 1, (m || 1) - 1, d || 1));
        }
        const diffMs = +next - +todayUTC;
        return Math.round(diffMs / (1000 * 60 * 60 * 24));
      };

      return (
        <div className="w-full space-y-2">
          {items.map((c: any) => {
            const initials = c.name
              .split(" ")
              .map((p: string) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const prettyBirth = c.birth_date ? formatPtBrLong(c.birth_date) : "—";
            const remaining = c.birth_date ? daysUntilBirthday(c.birth_date) : undefined;
            return (
              <div
                key={c.customer_id}
                className="flex items-center justify-between gap-4 rounded-3xl border border-[#0f67b2]/20 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f67b2]/10 text-[#0f67b2] text-sm font-semibold">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-stone-900 font-medium truncate">{c.name} • {c.customer_id}</div>
                    <div className="text-xs text-stone-600">Aniversário: {prettyBirth}{typeof remaining === "number" && (
                      <span className={"ml-2 " + (remaining === 0 ? "text-green-600 font-medium" : "text-stone-600")}>
                        {remaining === 0 ? "Hoje" : `Faltam ${remaining} dias`}
                      </span>
                    )}
                    </div>
                  </div>
                </div>
                <button
                  className="inline-flex items-center gap-1 rounded-full bg-[#0f67b2] text-white text-xs px-3 py-1 hover:opacity-90"
                  onClick={() =>
                    sendUserMessage(`Enviar parabéns para ${c.name} (ID ${c.customer_id}) que faz aniversário em ${c.birth_date}.`)
                  }
                >
                  <Gift size={14} /> Enviar parabéns
                </button>
              </div>
            );
          })}
        </div>
      );
    } catch {
      // fallthrough
    }
  }

  // Special rendering for date input request
  if (toolCall.name === "request_date_input") {
    let payload: any = {};
    try {
      payload = toolCall.output ? JSON.parse(toolCall.output) : {};
    } catch { }
    return (
      <div className="flex flex-col w-[70%] relative mb-[-8px]">
        <div className="flex flex-col text-sm rounded-[16px]">
          <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
            <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
              <Zap size={16} />
              <div className="text-sm font-medium">
                Solicitação de data
              </div>
            </div>
          </div>
          <div className="ml-4 mt-1">
            <DateInput prompt={payload.prompt || "Selecione uma data:"} placeholder={payload.placeholder} />
          </div>
        </div>
      </div>
    );
  }

  if (toolCall.name === "request_month_input") {
    let payload: any = {};
    try {
      payload = toolCall.output ? JSON.parse(toolCall.output) : {};
    } catch { }
    return (
      <div className="flex flex-col w-[70%] relative mb-[-8px]">
        <div className="flex flex-col text-sm rounded-[16px]">
          <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
            <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
              <Zap size={16} />
              <div className="text-sm font-medium">Selecionar mês</div>
            </div>
          </div>
          <div className="ml-4 mt-1">
            <MonthInput prompt={payload.prompt || "Selecione um mês:"} placeholder={payload.placeholder} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-[70%] relative mb-[-8px]">
      <div>
        <div className="flex flex-col text-sm rounded-[16px]">
          <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
            <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
              <Zap size={16} />
              <div className="text-sm font-medium">
                {toolCall.status === "completed"
                  ? `Called ${toolCall.name}`
                  : `Calling ${toolCall.name}...`}
              </div>
            </div>
          </div>

          <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
            <div className="max-h-96 overflow-y-scroll text-xs border-b mx-6 p-2">
              <SyntaxHighlighter
                customStyle={{
                  backgroundColor: "#fafafa",
                  padding: "8px",
                  paddingLeft: "0px",
                  marginTop: 0,
                  marginBottom: 0,
                }}
                language="json"
                style={coy}
              >
                {JSON.stringify(toolCall.parsedArguments, null, 2)}
              </SyntaxHighlighter>
            </div>
            <div className="max-h-96 overflow-y-scroll mx-6 p-2 text-xs">
              {toolCall.output ? (
                (() => {
                  try {
                    const parsed = JSON.parse(toolCall.output);
                    if (toolCall.name === "get_top_selling_products" && parsed && Array.isArray(parsed.items)) {
                      return (
                        <div className="text-sm">
                          <TopProductsTable items={parsed.items} currency={parsed.currency || "BRL"} />
                        </div>
                      );
                    }
                    return (
                      <SyntaxHighlighter
                        customStyle={{
                          backgroundColor: "#fafafa",
                          padding: "8px",
                          paddingLeft: "0px",
                          marginTop: 0,
                        }}
                        language="json"
                        style={coy}
                      >
                        {JSON.stringify(parsed, null, 2)}
                      </SyntaxHighlighter>
                    );
                  } catch {
                    return (
                      <SyntaxHighlighter
                        customStyle={{
                          backgroundColor: "#fafafa",
                          padding: "8px",
                          paddingLeft: "0px",
                          marginTop: 0,
                        }}
                        language="json"
                        style={coy}
                      >
                        {toolCall.output}
                      </SyntaxHighlighter>
                    );
                  }
                })()
              ) : (
                <div className="text-zinc-500 flex items-center gap-2 py-2">
                  <Clock size={16} /> Waiting for result...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileSearchCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex gap-2 items-center text-blue-500 mb-[-16px] ml-[-8px]">
      <BookOpenText size={16} />
      <div className="text-sm font-medium mb-0.5">
        {toolCall.status === "completed"
          ? "Searched files"
          : "Searching files..."}
      </div>
    </div>
  );
}

function WebSearchCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex gap-2 items-center text-blue-500 mb-[-16px] ml-[-8px]">
      <Globe size={16} />
      <div className="text-sm font-medium">
        {toolCall.status === "completed"
          ? "Searched the web"
          : "Searching the web..."}
      </div>
    </div>
  );
}

function McpCallCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex flex-col w-[70%] relative mb-[-8px]">
      <div>
        <div className="flex flex-col text-sm rounded-[16px]">
          <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
            <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
              <Zap size={16} />
              <div className="text-sm font-medium">
                {toolCall.status === "completed"
                  ? `Called ${toolCall.name} via MCP tool`
                  : `Calling ${toolCall.name} via MCP tool...`}
              </div>
            </div>
          </div>

          <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
            <div className="max-h-96 overflow-y-scroll text-xs border-b mx-6 p-2">
              <SyntaxHighlighter
                customStyle={{
                  backgroundColor: "#fafafa",
                  padding: "8px",
                  paddingLeft: "0px",
                  marginTop: 0,
                  marginBottom: 0,
                }}
                language="json"
                style={coy}
              >
                {JSON.stringify(toolCall.parsedArguments, null, 2)}
              </SyntaxHighlighter>
            </div>
            <div className="max-h-96 overflow-y-scroll mx-6 p-2 text-xs">
              {toolCall.output ? (
                <SyntaxHighlighter
                  customStyle={{
                    backgroundColor: "#fafafa",
                    padding: "8px",
                    paddingLeft: "0px",
                    marginTop: 0,
                  }}
                  language="json"
                  style={coy}
                >
                  {(() => {
                    try {
                      const parsed = JSON.parse(toolCall.output!);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return toolCall.output!;
                    }
                  })()}
                </SyntaxHighlighter>
              ) : (
                <div className="text-zinc-500 flex items-center gap-2 py-2">
                  <Clock size={16} /> Waiting for result...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeInterpreterCell({ toolCall }: ToolCallProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col w-[70%] relative mb-[-8px]">
      <div className="flex flex-col text-sm rounded-[16px]">
        <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
          <div
            className="flex gap-2 items-center text-blue-500 ml-[-8px] cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            <Code2 size={16} />
            <div className="text-sm font-medium">
              {toolCall.status === "completed"
                ? "Code executed"
                : "Running code interpreter..."}
            </div>
          </div>
        </div>
        <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
          <div className="mx-6 p-2 text-xs">
            <SyntaxHighlighter
              customStyle={{
                backgroundColor: "#fafafa",
                padding: "8px",
                paddingLeft: "0px",
                marginTop: 0,
              }}
              language="python"
              style={coy}
            >
              {toolCall.code || ""}
            </SyntaxHighlighter>
          </div>
        </div>
        {toolCall.files && toolCall.files.length > 0 && (
          <div className="flex gap-2 mt-2 ml-4 flex-wrap">
            {toolCall.files.map((f) => (
              <a
                key={f.file_id}
                href={`/api/container_files/content?file_id=${f.file_id}${f.container_id ? `&container_id=${f.container_id}` : ""}${f.filename ? `&filename=${encodeURIComponent(f.filename)}` : ""}`}
                download
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ededed] text-xs text-zinc-500"
              >
                {f.filename || f.file_id}
                <Download size={12} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToolCall({ toolCall }: ToolCallProps) {
  const isFullWidthTable =
    toolCall.tool_type === "function_call" &&
    (toolCall.name === "get_top_selling_products" ||
      toolCall.name === "get_products_without_sales_since" ||
      toolCall.name === "get_weekly_sales_comparison" ||
      toolCall.name === "get_overdue_payables" ||
      toolCall.name === "get_upcoming_payables_next_7_days" ||
      toolCall.name === "get_birthdays_by_month") &&
    !!toolCall.output;

  return (
    <div className={isFullWidthTable ? "w-full pt-2" : "flex justify-start pt-2"}>
      {(() => {
        switch (toolCall.tool_type) {
          case "function_call":
            return <ApiCallCell toolCall={toolCall} />;
          case "file_search_call":
            return <FileSearchCell toolCall={toolCall} />;
          case "web_search_call":
            return <WebSearchCell toolCall={toolCall} />;
          case "mcp_call":
            return <McpCallCell toolCall={toolCall} />;
          case "code_interpreter_call":
            return <CodeInterpreterCell toolCall={toolCall} />;
          default:
            return null;
        }
      })()}
    </div>
  );
}
