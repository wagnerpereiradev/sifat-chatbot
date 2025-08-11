const PT_MONTHS = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
];

function normalizeMonth(input: string): number | null {
    const lower = input.toLowerCase().trim();
    const num = Number(lower);
    if (!Number.isNaN(num) && num >= 1 && num <= 12) return num;
    const idx = PT_MONTHS.indexOf(lower);
    return idx >= 0 ? idx + 1 : null;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get("month");
        if (!monthParam) {
            return new Response(
                JSON.stringify({ error: 'Missing required query param "month"' }),
                { status: 400 }
            );
        }
        const month = normalizeMonth(monthParam);
        if (!month) {
            return new Response(
                JSON.stringify({ error: 'Invalid month. Use 1-12 or pt-BR month name.' }),
                { status: 400 }
            );
        }

        // Mock de clientes
        const baseItems = [
            { customer_id: "C001", name: "Alice Costa", birth_date: "1990-07-05" },
            { customer_id: "C002", name: "Bruno Dias", birth_date: "1988-07-21" },
            { customer_id: "C003", name: "Carla Souza", birth_date: "1995-08-10" },
            { customer_id: "C004", name: "Diego Lima", birth_date: "1992-07-30" },
            { customer_id: "C005", name: "Eduarda Nunes", birth_date: "1991-12-12" },
            // Setembro
            { customer_id: "C006", name: "Felipe Andrade", birth_date: "1987-09-03" },
            { customer_id: "C007", name: "Gabriela Teixeira", birth_date: "1993-09-19" },
            { customer_id: "C008", name: "Henrique Souza", birth_date: "1985-09-27" },
            { customer_id: "C009", name: "Isabela Martins", birth_date: "1999-09-12" },
        ];

        // Filtra pelo mês solicitado
        const itemsFiltered = baseItems.filter(
            (c) => new Date(`${c.birth_date}T00:00:00Z`).getUTCMonth() + 1 === month
        );

        // Ordena pelo aniversário mais próximo (dias restantes a partir de hoje)
        const today = new Date();
        const todayUTC = new Date(
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
        );
        const daysUntil = (isoBirthDate: string) => {
            const [m, d] = isoBirthDate.split("-").map(Number);
            let next = new Date(Date.UTC(todayUTC.getUTCFullYear(), (m || 1) - 1, d || 1));
            if (next < todayUTC) {
                next = new Date(Date.UTC(todayUTC.getUTCFullYear() + 1, (m || 1) - 1, d || 1));
            }
            return Math.floor((+next - +todayUTC) / (1000 * 60 * 60 * 24));
        };

        const items = itemsFiltered
            .map((c) => ({ ...c, _days: daysUntil(c.birth_date) }))
            .sort((a, b) => a._days - b._days)
            .map(({ ...rest }) => rest);

        return new Response(
            JSON.stringify({ items, month }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error getting birthdays by month:", error);
        return new Response(
            JSON.stringify({ error: "Error getting birthdays by month" }),
            { status: 500 }
        );
    }
}


