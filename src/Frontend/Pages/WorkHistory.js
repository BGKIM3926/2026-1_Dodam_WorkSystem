import { Box } from '@mui/material';
import HistoryHeader from './components/HistoryHeader';
import HistoryActions from './components/HistoryActions';
import HistoryList from './components/HistoryList';
import { useState, useEffect } from 'react';
import { useSelectedNode } from '../Contexts/SelectedNodeContext';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';


export default function WorkHistory() {
    const [rows, setRows] = useState([]);
    const { selectedNode } = useSelectedNode();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('전체');
    const isGlobalView = !selectedNode?.systemId;

    const filteredRows =
        filter === '전체'
            ? rows
            : rows.filter(row => row.workType === filter);

    useEffect(() => {
        console.log('selectedNode:', selectedNode);

        // 트리 구조에서 선택했다면 기존 방식
        if (selectedNode?.systemId) {
            fetch(`http://localhost:8080/api/history?systemId=${selectedNode.systemId}`)
                .then(res => res.json())
                .then(data => setRows(data))
                .catch(err => console.error(err));
        }
        // 이력 관리 버튼 그 자체를 클릭했다면 전체 조회
        else {
            fetch(`http://localhost:8080/api/history/all`)
                .then(res => res.json())
                .then(data => setRows(data))
                .catch(err => console.error(err));
        }

    }, [selectedNode]);

    useEffect(() => {
        const user = localStorage.getItem('loginUser');

        if (!user) {
            navigate('/');
        }
    }, []);

    return (
        <>
            <Container
                maxWidth="lg"
                component="main"
                sx={{ display: 'flex', flexDirection: 'column', my: 16, gap: 2 }}>
                <HistoryHeader selectedNode={selectedNode} rows={rows} />
                <HistoryActions filter={filter} setFilter={setFilter} isGlobalView={isGlobalView} />
                <HistoryList rows={filteredRows} isGlobalView={isGlobalView} />
            </Container>

            
        </>        
    );
}