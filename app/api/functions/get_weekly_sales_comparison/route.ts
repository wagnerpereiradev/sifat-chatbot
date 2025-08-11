function parsePeriod(period?: string): { start: string; end: string } {
    const today = new Date();
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    if (!period || period === "last_month") {
        const start = new Date(end);
        start.setUTCMonth(start.getUTCMonth() - 1);
        return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    if (period === "last_3_months") {
        const start = new Date(end);
        start.setUTCMonth(start.getUTCMonth() - 3);
        return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    // Custom interval: YYYY-MM-DD:YYYY-MM-DD
    const parts = period.split(":");
    if (parts.length === 2) {
        return { start: parts[0], end: parts[1] };
    }
    // fallback
    return { start: end.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "last_month";
        const metrics = (searchParams.get("metrics") || "revenue,orders,avg_ticket")
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean);

        const { start, end } = parsePeriod(period);

        // TODO: Integrar com sua base; mock abaixo gera semanas e métricas solicitadas
        const weeks = [
            { week: "2025-W26", start: "2025-06-23", end: "2025-06-29" },
            { week: "2025-W27", start: "2025-06-30", end: "2025-07-06" },
            { week: "2025-W28", start: "2025-07-07", end: "2025-07-13" },
            { week: "2025-W29", start: "2025-07-14", end: "2025-07-20" },
            { week: "2025-W30", start: "2025-07-21", end: "2025-07-27" },
            { week: "2025-W31", start: "2025-07-28", end: "2025-08-03" },
        ];

        const data = weeks.map((w, i) => {
            const row: any = { week: w.week, start: w.start, end: w.end };
            if (metrics.includes("revenue")) row.revenue = 20000 + i * 2500 + (i % 2 ? 1200 : 800);
            if (metrics.includes("orders")) row.orders = 300 + i * 20 + (i % 2 ? 10 : 0);
            if (metrics.includes("avg_ticket")) {
                const rev = row.revenue ?? 25000;
                const ord = row.orders ?? 350;
                row.avg_ticket = rev / ord;
            }
            return row;
        });

        return new Response(
            JSON.stringify({
                period: { start, end },
                metrics,
                weeks: data,
                currency: "BRL",
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error getting weekly sales comparison:", error);
        return new Response(
            JSON.stringify({ error: "Error getting weekly sales comparison" }),
            { status: 500 }
        );
    }
}


