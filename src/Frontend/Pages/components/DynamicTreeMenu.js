import * as React from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

export default function DynamicTreeMenu({ data, onSelect }) {
    const renderTree = (nodes) =>
        nodes.map((node) => (
            <TreeItem key={node.id} itemId={node.id} label={node.name}>
                {node.children && renderTree(node.children)}
            </TreeItem>
        ));

    return (
        <SimpleTreeView onSelectedItemsChange={(e, id) => onSelect(id)}>
            {/* <TreeItem itemId="root" label="이력 관리">
                {renderTree(data)}
            </TreeItem> */}
            {renderTree(data)}
        </SimpleTreeView>
    );
}