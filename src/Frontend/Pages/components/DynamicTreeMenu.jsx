import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useState } from 'react';

export default function DynamicTreeMenu({ data, onSelect, selectedNode }) {
    const [expanded, setExpanded] = useState([]);

    const handleExpand = (nodeId) => {
        setExpanded((prev) =>
            prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
        );
    };

    const renderTree = (nodes) =>
        nodes.map((node) => (
            <TreeItem
                key={node.id}
                itemId={node.id}
                label={node.name}
                onClick={(e) => {
                    e.stopPropagation();

                    if (!node.serviceName) {
                        handleExpand(node.id);
                    } else {
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
            selectedItems={selectedNode?.serviceId ? [String(selectedNode.serviceId)] : []}
        >
            {renderTree(data)}
        </SimpleTreeView>
    );
}
