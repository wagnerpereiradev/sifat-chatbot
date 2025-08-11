import React from "react";

type TopProduct = {
    product_id: string;
    name: string;
    quantity_sold: number;
    revenue: number;
    selling_price: number;
};

interface Props {
    items: TopProduct[];
    currency?: string; // e.g., "BRL"
}

const currencyFormatter = (value: number, currency: string = "BRL") =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(value);

export default function TopProductsTable({ items, currency = "BRL" }: Props) {
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-[#0f67b2]/20 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-[#0f67b2]/5 text-stone-700">
                            <th className="px-4 py-3 text-left font-medium">#</th>
                            <th className="px-4 py-3 text-left font-medium">Produto</th>
                            <th className="px-4 py-3 text-left font-medium">Código</th>
                            <th className="px-4 py-3 text-right font-medium">Qtd. Vendida</th>
                            <th className="px-4 py-3 text-right font-medium">Faturamento</th>
                            <th className="px-4 py-3 text-right font-medium">Preço de Venda</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p, idx) => (
                            <tr
                                key={p.product_id}
                                className={idx % 2 === 0 ? "bg-white" : "bg-stone-50"}

                            >
                                <td className="px-4 py-3 text-stone-600">{idx + 1}</td>
                                <td className="px-4 py-3 font-medium text-stone-800">{p.name}</td>
                                <td className="px-4 py-3 text-stone-600">{p.product_id}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                                    {p.quantity_sold.toLocaleString("pt-BR")}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-stone-700" title={String(p.revenue)}>
                                    {currencyFormatter(p.revenue, currency)}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-stone-700" title={String(p.selling_price)}>
                                    {currencyFormatter(p.selling_price, currency)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


