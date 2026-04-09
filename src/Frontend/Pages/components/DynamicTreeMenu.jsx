import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useState } from 'react';

export default function DynamicTreeMenu({ data, onSelect, selectedNode }) {
    const [expanded, setExpanded] = useState([]);

    const handleExpand = (nodeId) => {
        setExpanded((prev) =>
            prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
        );
    };

    const renderTree = (nodes) =>
        nodes.map((node) => (
            <TreeItem
                key={node.id}
                itemId={node.id}
                label={node.name}

                // 🔥 클릭 시 펼치기 및 선택
                onClick={(e) => {
                    console.log(node);
                    e.stopPropagation();

                    if (!node.serviceName) {
                        // 부모 노드 클릭: 펼치기
                        handleExpand(node.id);
                    } else {
                        // 자식 노드 클릭: 선택
                        onSelect(node);
                    }
                }}
            >
                {node.children && renderTree(node.children)}
            </TreeItem>
        ));

    return (
        <SimpleTreeView
            expandedItems={expanded}
            selectedItems={
                selectedNode?.systemId
                    ? [String(selectedNode.systemId)]
                    : []
            }
        >
            {renderTree(data)}
        </SimpleTreeView>
    );
}