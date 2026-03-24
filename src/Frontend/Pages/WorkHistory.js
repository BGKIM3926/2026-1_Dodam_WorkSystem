import { Box } from '@mui/material';
import HistoryHeader from './components/HistoryHeader';
import HistoryActions from './components/HistoryActions';
import HistoryList from './components/HistoryList';
import { useState, useEffect } from 'react';
import { useSelectedNode } from '../Contexts/SelectedNodeContext';


export default function WorkHistory() {
    const [rows, setRows] = useState([]);
    const { selectedNode } = useSelectedNode();

    useEffect(() => {
        console.log('selectedNode:', selectedNode);

        if (!selectedNode?.systemId) return;

        fetch(`http://localhost:8080/api/history?systemId=${selectedNode.systemId}`)
            .then(res => res.json())
            .then(data => {
                console.log('API 결과:', data);
                setRows(data);
            })
            .catch(err => console.error(err));

    }, [selectedNode]);

    return (
        <Box>
            <HistoryHeader selectedNode={selectedNode} rows={rows} />
            <HistoryActions />
            <HistoryList rows={rows} />
        </Box>
    );
}