export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const periodicidade = searchParams.get("periodicidade") || "CUSTOMIZADO";
        const considerarFaturamento = (searchParams.get("considerarFaturamento") || "true").toLowerCase() === "true";
        const dataInicial = searchParams.get("dataInicial") || "";
        const dataFinal = searchParams.get("dataFinal") || "";

        // Validação mínima
        // Se CUSTOMIZADO sem datas, usar janela padrão dos últimos 30 dias
        let start = dataInicial;
        let end = dataFinal;
        if (periodicidade === "CUSTOMIZADO" && (!start || !end)) {
            const now = new Date();
            const endDate = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                0, 0, 0
            ));
            const startDate = new Date(endDate);
            startDate.setUTCDate(startDate.getUTCDate() - 30);
            const iso = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T00:00:00`;
            start = iso(startDate);
            end = iso(endDate);
        }

        const token = process.env.WAYBE_ERP_TOKEN;
        if (!token) {
            return new Response(
                JSON.stringify({ error: "Token WAYBE_ERP_TOKEN não configurado no ambiente." }),
                { status: 500 }
            );
        }

        const extParams = new URLSearchParams({
            periodicidade,
            considerarFaturamento: String(considerarFaturamento),
        });
        if (start) extParams.set("dataInicial", start);
        if (end) extParams.set("dataFinal", end);

        const baseUrl = (process.env.WAYBE_ERP_BASE_URL || "https://api.waybe.com.br").replace(/\/$/, "");
        const url = `${baseUrl}/relatorios/indicador-faturamento/top-10-produtos-vendidos?${extParams.toString()}`;

        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            console.error("WAYBE API error", resp.status, text);
            return new Response(
                JSON.stringify({ error: "Falha ao consultar API WAYBE", status: resp.status, details: text }),
                { status: 502 }
            );
        }

        const arr = (await resp.json()) as Array<{
            produto: string;
            quantidade: number;
            faturamento: number;
            custo?: number;
        }>;

        // Mantém exatamente os campos da API externa nos itens
        const items = Array.isArray(arr) ? arr : [];

        return new Response(
            JSON.stringify({ items, currency: "BRL", period: { start: start || null, end: end || null } }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error getting top selling products:", error);
        return new Response(
            JSON.stringify({ error: "Error getting top selling products" }),
            { status: 500 }
        );
    }
}


