export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const since = searchParams.get("since");

        if (!since) {
            return new Response(
                JSON.stringify({ error: 'Missing required query param "since" (YYYY-MM-DD)' }),
                { status: 400 }
            );
        }

        // TODO: Integrar com a fonte de dados real
        // Exemplo estático de produtos (inclui datas em julho/2025 e agosto/2025)
        const allItems = [
            { product_id: "P011", name: "Produto K", last_sale_date: null },
            { product_id: "P012", name: "Produto L", last_sale_date: "2023-10-01" },
            { product_id: "P013", name: "Produto M", last_sale_date: "2023-09-15" },
            { product_id: "P014", name: "Produto N", last_sale_date: "2025-08-12" },
            { product_id: "P015", name: "Produto O", last_sale_date: "2025-07-20" },
            { product_id: "P016", name: "Produto P", last_sale_date: "2024-12-01" },
            { product_id: "P017", name: "Produto Q", last_sale_date: "2025-02-10" },
        ];

        // Filtra produtos sem vendas desde a data (last_sale_date inexistente ou anterior a 'since')
        const sinceDate = new Date(`${since}T00:00:00Z`);
        const items = allItems.filter((p) => {
            if (!p.last_sale_date) return true;
            const last = new Date(`${p.last_sale_date}T00:00:00Z`);
            return last < sinceDate;
        });

        return new Response(
            JSON.stringify({ items, since }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error getting products without sales since:", error);
        return new Response(
            JSON.stringify({ error: "Error getting products without sales since" }),
            { status: 500 }
        );
    }
}


