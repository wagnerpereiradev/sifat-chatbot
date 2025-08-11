export async function GET() {
    try {
        // Mock: títulos com vencimento nos próximos 7 dias a partir de hoje
        const today = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        const d1 = new Date(today);
        d1.setDate(d1.getDate() + 1);
        const d3 = new Date(today);
        d3.setDate(d3.getDate() + 3);
        const d7 = new Date(today);
        d7.setDate(d7.getDate() + 7);

        const items = [
            { title_id: "T2001", supplier: "Fornecedor X", due_date: toISO(d1), amount: 950.0, status: "upcoming" },
            { title_id: "T2002", supplier: "Fornecedor Y", due_date: toISO(d3), amount: 1275.5, status: "upcoming" },
            { title_id: "T2003", supplier: "Fornecedor Z", due_date: toISO(d7), amount: 2200.0, status: "upcoming" },
        ];

        return new Response(
            JSON.stringify({ items, range: { start: toISO(today), end: toISO(d7) }, currency: "BRL" }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error getting upcoming payables:", error);
        return new Response(
            JSON.stringify({ error: "Error getting upcoming payables" }),
            { status: 500 }
        );
    }
}


