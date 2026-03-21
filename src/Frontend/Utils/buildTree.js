export function buildTree(data) {
    const map = {};

    data.forEach((item) => {
        const customer = item.customerName;
        const service = item.serviceNameMin;

        if (!map[customer]) {
            map[customer] = {
                id: customer,
                name: customer,
                children: [],
            };
        }

        if (!map[customer].children.find((c) => c.name === service)) {
            map[customer].children.push({
                id: `${customer}-${service}`,
                name: service,
            });
        }
    });

    return Object.values(map);
}