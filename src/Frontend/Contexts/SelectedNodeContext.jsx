import { createContext, useContext, useState } from 'react';

const SelectedNodeContext = createContext();

export function SelectedNodeProvider({ children }) {
    const [selectedNode, setSelectedNode] = useState(null);

    return (
        <SelectedNodeContext.Provider value={{ selectedNode, setSelectedNode }}>
            {children}
        </SelectedNodeContext.Provider>
    );
}

export function useSelectedNode() {
    return useContext(SelectedNodeContext);
}