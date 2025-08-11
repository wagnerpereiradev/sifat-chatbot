export async function GET() {
    try {
        // TODO: Integrar com sua fonte de dados real (DB/serviço) e aplicar filtros/períodos
        const baseItems = [
            { product_id: "P001", name: "Produto A", quantity_sold: 1234, revenue: 45000.5 },
            { product_id: "P002", name: "Produto B", quantity_sold: 1187, revenue: 38950.0 },
            { product_id: "P003", name: "Produto C", quantity_sold: 995, revenue: 31210.3 },
            { product_id: "P004", name: "Produto D", quantity_sold: 876, revenue: 29870.9 },
            { product_id: "P005", name: "Produto E", quantity_sold: 842, revenue: 28740.2 },
            { product_id: "P006", name: "Produto F", quantity_sold: 803, revenue: 26890.1 },
            { product_id: "P007", name: "Produto G", quantity_sold: 771, revenue: 25110.0 },
            { product_id: "P008", name: "Produto H", quantity_sold: 745, revenue: 24550.8 },
            { product_id: "P009", name: "Produto I", quantity_sold: 703, revenue: 23220.0 },
            { product_id: "P010", name: "Produto J", quantity_sold: 690, revenue: 22800.0 },
        ];

        const items = baseItems.map((it) => ({
            ...it,
            selling_price: it.revenue / it.quantity_sold,
        }));

        const data = {
            items,
            period: {
                start: null,
                end: null,
            },
            currency: "BRL",
        };

        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
        console.error("Error getting top selling products:", error);
        return new Response(
            JSON.stringify({ error: "Error getting top selling products" }),
            { status: 500 }
        );
    }
}


