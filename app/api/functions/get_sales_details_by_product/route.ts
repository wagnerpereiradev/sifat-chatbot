export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const idProdutoEmpresa = searchParams.get("idProdutoEmpresa");
        const dataInicial = searchParams.get("dataInicial");
        const dataFinal = searchParams.get("dataFinal");
        const page = searchParams.get("page") || "0";
        const size = searchParams.get("size") || "2000";

        if (!idProdutoEmpresa || !dataInicial || !dataFinal) {
            return new Response(
                JSON.stringify({ error: "Parâmetros obrigatórios: idProdutoEmpresa, dataInicial (YYYY-MM-DD), dataFinal (YYYY-MM-DD)" }),
                { status: 400 }
            );
        }

        const token = process.env.WAYBE_ERP_TOKEN;
        if (!token) {
            return new Response(
                JSON.stringify({ error: "Token WAYBE_ERP_TOKEN não configurado no ambiente." }),
                { status: 500 }
            );
        }

        const baseUrl = (process.env.WAYBE_ERP_BASE_URL || "https://api.waybe.com.br").replace(/\/$/, "");
        const extParams = new URLSearchParams({ idProdutoEmpresa, dataInicial, dataFinal, page, size });
        const url = `${baseUrl}/vendas/nota?${extParams.toString()}`;

        const resp = await fetch(url, {
            method: "GET",
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

        const json = await resp.json();
        const content = Array.isArray(json?.content) ? json.content : [];

        // Redução de campos para análise de horário de venda
        const items = content.map((n: any) => ({
            idNota: n.idNota,
            idEmpresa: n.idEmpresa,
            nomeEmpresa: n.nomeEmpresa,
            status: n.status,
            dataVenda: n.dataVenda,
            horaVenda: n.horaVenda,
            valorSubtotal: n.valorSubtotal,
            valorFrete: n.valorFrete,
            valorTotalServico: n.valorTotalServico,
            valorTotal: n.valorTotal,
        }));

        // Histograma por hora (00..23) e horários de pico
        const hourlyHistogram = Array.from({ length: 24 }, (_, h) => ({
            hour: String(h).padStart(2, "0"),
            count: 0,
        }));

        for (const it of items) {
            if (typeof it.horaVenda === "string" && it.horaVenda.includes(":")) {
                const hourStr = it.horaVenda.split(":")[0];
                const hourNum = parseInt(hourStr, 10);
                if (!Number.isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
                    hourlyHistogram[hourNum].count += 1;
                }
            }
        }

        const maxCount = hourlyHistogram.reduce((m, b) => Math.max(m, b.count), 0);
        const peakHours = hourlyHistogram.filter((b) => b.count === maxCount && maxCount > 0);

        return new Response(
            JSON.stringify({
                items,
                page: json?.number ?? 0,
                size: json?.size ?? items.length,
                totalElements: json?.totalElements ?? items.length,
                totalPages: json?.totalPages ?? 1,
                first: json?.first ?? true,
                last: json?.last ?? true,
                hourlyHistogram,
                peakHours,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error getting sales details by product:", error);
        return new Response(
            JSON.stringify({ error: "Error getting sales details by product" }),
            { status: 500 }
        );
    }
}


