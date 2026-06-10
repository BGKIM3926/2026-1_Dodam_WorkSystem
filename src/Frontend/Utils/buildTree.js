export function buildTree(data, legacyServiceIds = []) {
    const legacySet = new Set((legacyServiceIds || []).map((id) => Number(id)));

    const roots = {
        active: {
            id: 'root-active',
            name: '작업 진행 중',
            children: {},
        },
        closed: {
            id: 'root-closed',
            name: '작업 종료',
            children: {},
        },
    };

    data.forEach((item) => {
        const serviceId = item.serviceId != null ? Number(item.serviceId) : null;
        const isLegacy = serviceId != null && legacySet.has(serviceId);
        const targetRoot = isLegacy ? roots.closed : roots.active;
        const customerName = item.customerName || '미분류';
        const serviceName = item.serviceNameMin || '(서비스명 없음)';

        if (!targetRoot.children[customerName]) {
            targetRoot.children[customerName] = {
                id: `${targetRoot.id}-${customerName}`,
                name: customerName,
                children: {},
            };
        }

        const serviceKey = `${serviceName}-${serviceId ?? 'none'}`;
        if (!targetRoot.children[customerName].children[serviceKey]) {
            targetRoot.children[customerName].children[serviceKey] = {
                id: `${targetRoot.id}-${customerName}-${serviceKey}`,
                name: serviceName,
                serviceName,
                customerName,
                serviceId,
                isLegacy,
            };
        }
    });

    const sortByName = (a, b) => a.name.localeCompare(b.name, 'ko');

    const toNodeArray = (root) => ({
        ...root,
        children: Object.values(root.children)
            .sort(sortByName)
            .map((customerNode) => ({
                ...customerNode,
                children: Object.values(customerNode.children).sort(sortByName),
            })),
    });

    return [toNodeArray(roots.active), toNodeArray(roots.closed)];
}
