export function buildTree(data) {
    const map = {};

    data.forEach(item => {

        // customer 생성
        if (!map[item.customerName]) {
            map[item.customerName] = {
                id: item.customerName,
                name: item.customerName,
                children: {}
            };
        }

        // service 추가 (중복 제거)
        if (!map[item.customerName].children[item.serviceNameMin]) {
            map[item.customerName].children[item.serviceNameMin] = {
                id: item.customerName + '-' + item.serviceNameMin,
                name: item.serviceNameMin,
                serviceName: item.serviceNameMin,
                customerName: item.customerName
            };
        }
    });

    // children 객체 → 배열 변환
    return Object.values(map).map(customer => ({
        ...customer,
        children: Object.values(customer.children)
    }));
}