import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelectedNode } from '../Contexts/SelectedNodeContext';
import HistoryActions from './components/HistoryActions';
import HistoryHeader from './components/HistoryHeader';
import HistoryList from './components/HistoryList';


export default function WorkHistory() {
    const [rows, setRows] = useState([]);
    const [managerRows, setManagerRows] = useState([]);
    const { selectedNode, setSelectedNode } = useSelectedNode();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [filter, setFilter] = useState('정기점검');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [serviceId, setServiceId] = useState(null);
    const customerNameFromQuery = searchParams.get('customerName');
    const serviceNameFromQuery = searchParams.get('serviceName');
    const customerName = selectedNode?.customerName ?? customerNameFromQuery;
    const serviceName = selectedNode?.serviceName ?? serviceNameFromQuery;
    const effectiveSelectedNode = customerName && serviceName
        ? { customerName, serviceName }
        : null;
    const isGlobalView = !effectiveSelectedNode?.serviceName;

    const fetchRows = () => {
        if (!serviceName) {
            setRows([]);
            return;
        }

        const url = serviceId
            ? `/api/history?serviceId=${serviceId}`
            : `/api/history?serviceName=${serviceName}`;

        fetch(url)
            .then((res) => res.json())
            .then((data) => setRows(data))
            .catch((err) => console.error(err));
    };

    const fetchServiceId = () => {
        if (!serviceName || !customerName) return;

        fetch(`/api/dsystem/filter?serviceName=${serviceName}&customerName=${customerName}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.length > 0 && data[0].serviceId) {
                    setServiceId(data[0].serviceId);
                }
            })
            .catch((err) => console.error(err));
    };

    const fetchManagers = () => {
        if (!serviceId) {
            setManagerRows([]);
            return;
        }

        fetch(`/api/service-manager?serviceId=${serviceId}`)
            .then((res) => res.json())
            .then((data) => setManagerRows(data))
            .catch((err) => console.error(err));
    };

    const filteredRows = rows.filter(row => {
        // 1. workType 필터
        const matchType = row.workType === filter;

        // 2. 날짜 필터 (visitDate 없으면 통과)
        const rowDate = row.visitDate ? dayjs(row.visitDate) : null;

        const matchStart =
            !startDate || (rowDate && rowDate.isAfter(startDate.subtract(1, 'day')));

        const matchEnd =
            !endDate || (rowDate && rowDate.isBefore(endDate.add(1, 'day')));

        return matchType && matchStart && matchEnd;
    });

    useEffect(() => {
        if (!selectedNode?.serviceName && customerNameFromQuery && serviceNameFromQuery) {
            setSelectedNode({
                customerName: customerNameFromQuery,
                serviceName: serviceNameFromQuery,
            });
        }
    }, [selectedNode?.serviceName, customerNameFromQuery, serviceNameFromQuery, setSelectedNode]);

    useEffect(() => {
        fetchRows();
        fetchServiceId();
    }, [customerName, serviceName]);

    useEffect(() => {
        if (serviceId) {
            fetchRows();
        }
    }, [serviceId]);

    useEffect(() => {
        if (filter === '기관정보') {
            fetchManagers();
        }
    }, [filter, serviceId]);

    useEffect(() => {
        const user = localStorage.getItem('loginUser');

        if (!user) {
            navigate('/');
        }
    }, []);

    return (
        <>
            <Container
                maxWidth={false}
                component="main"
                disableGutters
                sx={{ display: 'flex', flexDirection: 'column', my: 16, gap: 2, alignItems: 'stretch', px: { xs: 2, sm: 3, md: 4 } }}>
                <HistoryHeader selectedNode={effectiveSelectedNode} rows={rows} />
                {isGlobalView ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                        <Typography variant="h6" color="text.secondary">
                            좌측 메뉴에서 사이트 / 서비스를 선택해주세요
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <HistoryActions 
                            filter={filter} 
                            setFilter={setFilter} 
                            isGlobalView={isGlobalView} 
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate} />
                        <HistoryList 
                            rows={filter === '기관정보' ? managerRows : filteredRows} 
                            isGlobalView={isGlobalView} 
                            onRefresh={filter === '기관정보' ? fetchManagers : fetchRows} 
                            filter={filter} 
                        />
                    </>
                )}
            </Container>

            
        </>        
    );
}
