export async function GET() {
    try {
        // TODO: Integrar com fonte de dados real
        const today = new Date().toISOString().slice(0, 10);
        const items = [
            { title_id: "T1001", supplier: "Fornecedor A", due_date: "2025-05-10", amount: 1520.35, status: "overdue" },
            { title_id: "T1002", supplier: "Fornecedor B", due_date: "2025-04-28", amount: 870.0, status: "overdue" },
            { title_id: "T1003", supplier: "Fornecedor C", due_date: "2025-03-15", amount: 2210.9, status: "overdue" },
        ];

        return new Response(
            JSON.stringify({ items, as_of: today, currency: "BRL" }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error getting overdue payables:", error);
        return new Response(
            JSON.stringify({ error: "Error getting overdue payables" }),
            { status: 500 }
        );
    }
}


