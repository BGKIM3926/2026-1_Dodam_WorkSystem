export function buildTree(data) {
    const map = {};

    data.forEach(item => {
        if (!map[item.customerName]) {
            map[item.customerName] = {
                id: item.customerName,
                name: item.customerName,
                region: item.customerName, // 🔥 지역
                children: []
            };
        }

        map[item.customerName].children.push({
            id: item.systemID,
            name: item.systemNameMin,
            systemId: item.systemID, // 🔥 핵심
            region: item.customerName
        });
    });

    return Object.values(map);
}