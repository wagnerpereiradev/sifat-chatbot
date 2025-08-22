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
        const hourlyHistogram: Array<{ hour: string; saleCount: number; productQty: number; saleAmountTotal: number }> = Array.from({ length: 24 }, (_, h) => ({
            hour: String(h).padStart(2, "0"),
            saleCount: 0,
            productQty: 0,
            saleAmountTotal: 0,
        }));

        // Buscar quantidade de produtos por nota
        const productIdNum = Number(idProdutoEmpresa);

        async function fetchNoteProductQuantity(noteId: number): Promise<number> {
            try {
                const urlItems = `${baseUrl}/vendas/nota-item/buscar-todos/${noteId}`;
                const respItems = await fetch(urlItems, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        // sem Content-Type pois não enviaremos body
                    },
                });
                if (!respItems.ok) {
                    // Em caso de erro no detalhe, considerar 0 para não quebrar todo o cálculo
                    return 0;
                }
                const arr = await respItems.json();
                if (!Array.isArray(arr)) return 0;
                // Somar apenas itens do tipo ITEM e não cancelados (por segurança, também confere o idProdutoEmpresa)
                const sum = arr.reduce((acc: number, it: any) => {
                    const isItem = (it?.tipo || "").toUpperCase() === "ITEM";
                    const notCancelled = it?.cancelado === false || it?.cancelado === undefined || it?.cancelado === null;
                    const sameProduct = Number(it?.idProdutoEmpresa) === productIdNum || productIdNum === 0 || Number.isNaN(productIdNum);
                    if (isItem && notCancelled && sameProduct) {
                        const q = Number(it?.quantidade || 0);
                        return acc + (Number.isFinite(q) ? q : 0);
                    }
                    return acc;
                }, 0);
                return sum;
            } catch {
                return 0;
            }
        }

        // Controle de concorrência simples
        const noteIds: number[] = items.map((n: any) => Number(n.idNota)).filter((v: number) => Number.isFinite(v));
        const noteIdToQty: Record<number, number> = {};
        const perSaleQuantities: Array<{ idNota: number; horaVenda: string | null; productQty: number }> = [];

        const concurrency = 8;
        let cursor = 0;
        async function runner() {
            while (cursor < noteIds.length) {
                const idx = cursor++;
                const noteId = noteIds[idx];
                const qty = await fetchNoteProductQuantity(noteId);
                noteIdToQty[noteId] = qty;
            }
        }
        const workers = Array.from({ length: Math.min(concurrency, noteIds.length) }, () => runner());
        await Promise.all(workers);

        // Preencher histograma com vendas, quantidade de produtos e valor total
        for (const it of items) {
            if (typeof it.horaVenda === "string" && it.horaVenda.includes(":")) {
                const hourStr = it.horaVenda.split(":")[0];
                const hourNum = parseInt(hourStr, 10);
                if (!Number.isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
                    hourlyHistogram[hourNum].saleCount += 1;
                    const qty = Number(noteIdToQty[Number(it.idNota)] || 0);
                    hourlyHistogram[hourNum].productQty += Number.isFinite(qty) ? qty : 0;
                    const saleAmount = Number(it?.valorTotal || 0);
                    hourlyHistogram[hourNum].saleAmountTotal += Number.isFinite(saleAmount) ? saleAmount : 0;
                    perSaleQuantities.push({ idNota: Number(it.idNota), horaVenda: it.horaVenda, productQty: qty });
                }
            }
        }

        const maxCount = hourlyHistogram.reduce((m, b) => Math.max(m, b.saleCount), 0);
        const peakHours = hourlyHistogram
            .filter((b) => b.saleCount === maxCount && maxCount > 0)
            .map((b) => ({ hour: b.hour, count: b.saleCount }));

        const totalSales = items.length;
        const totalProductQty = Object.values(noteIdToQty).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
        const totalRevenue = hourlyHistogram.reduce((acc, b) => acc + (Number.isFinite(b.saleAmountTotal) ? b.saleAmountTotal : 0), 0);

        return new Response(
            JSON.stringify({
                // manter informações de paginação originais para compatibilidade
                page: json?.number ?? 0,
                size: json?.size ?? totalSales,
                totalElements: json?.totalElements ?? totalSales,
                totalPages: json?.totalPages ?? 1,
                first: json?.first ?? true,
                last: json?.last ?? true,
                // novos campos de resumo
                totalSales,
                totalProductQty,
                totalRevenue,
                // histograma com duas métricas
                hourlyHistogram,
                // horários de pico por contagem de vendas (compatibilidade: {hour, count})
                peakHours,
                // quantidade por venda (forma enxuta, sem objetos completos da venda)
                perSaleQuantities,
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


