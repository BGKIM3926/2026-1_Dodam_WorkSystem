import * as React from 'react';
import { useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

export default function DynamicTreeMenu({ data, onSelect, selectedNode }) {
    const [expanded, setExpanded] = useState([]);

    const handleExpand = (nodeId) => {
        setExpanded((prev) =>
            prev.includes(nodeId) ? prev : [...prev, nodeId]
        );
    };

    const renderTree = (nodes) =>
        nodes.map((node) => (
            <TreeItem
                key={node.id}
                itemId={node.id}
                label={node.name}

                // 🔥 hover 시 펼치기
                onMouseEnter={() => handleExpand(node.id)}

                // 🔥 클릭 처리
                onClick={(e) => {
                    console.log(node);
                    e.stopPropagation();

                    if (!node.systemId) return; // 부모 클릭 방지

                    onSelect(node);
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