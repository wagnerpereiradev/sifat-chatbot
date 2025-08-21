import React from "react";

type TopProduct = {
    produto: string;
    quantidade: number;
    faturamento: number;
    custo?: number;
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
                            <th className="px-4 py-3 text-right font-medium">Quantidade</th>
                            <th className="px-4 py-3 text-right font-medium">Faturamento</th>
                            <th className="px-4 py-3 text-right font-medium">Custo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p, idx) => (
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
                                    {currencyFormatter(Number(p.faturamento || 0), currency)}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-stone-700" title={String(p.custo)}>
                                    {currencyFormatter(Number(p.custo || 0), currency)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


