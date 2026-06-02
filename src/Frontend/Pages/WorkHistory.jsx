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
    const [reportRows, setReportRows] = useState([]);
    const { selectedNode, setSelectedNode } = useSelectedNode();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [filter, setFilter] = useState('정기점검');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [serviceId, setServiceId] = useState(null);
    const [isLegacyService, setIsLegacyService] = useState(false);
    const customerNameFromQuery = searchParams.get('customerName');
    const serviceNameFromQuery = searchParams.get('serviceName');
    const workTypeFromQuery = searchParams.get('workType');
    const historyIdFromQuery = searchParams.get('historyId');
    const customerName = selectedNode?.customerName ?? customerNameFromQuery;
    const serviceName = selectedNode?.serviceName ?? serviceNameFromQuery;
    const effectiveSelectedNode = customerName && serviceName
        ? { customerName, serviceName }
        : null;
    const isGlobalView = !effectiveSelectedNode?.serviceName;
    const isReportView = filter === '점검서 관리';

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

    const fetchReportRows = () => {
        if (!serviceId) {
            setReportRows([]);
            return;
        }

        fetch(`/api/info/reports?serviceId=${serviceId}`)
            .then((res) => res.json())
            .then((data) => setReportRows(data))
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

    const filteredReportRows = reportRows.filter((row) => {
        const rowDate = row.receivedAt ? dayjs(row.receivedAt) : null;

        const matchStart =
            !startDate || (rowDate && rowDate.isAfter(startDate.subtract(1, 'day')));

        const matchEnd =
            !endDate || (rowDate && rowDate.isBefore(endDate.add(1, 'day')));

        return matchStart && matchEnd;
    });

    useEffect(() => {
        if (
            customerNameFromQuery &&
            serviceNameFromQuery &&
            (
                selectedNode?.customerName !== customerNameFromQuery ||
                selectedNode?.serviceName !== serviceNameFromQuery
            )
        ) {
            setSelectedNode({
                customerName: customerNameFromQuery,
                serviceName: serviceNameFromQuery,
            });
        }
    }, [selectedNode?.customerName, selectedNode?.serviceName, customerNameFromQuery, serviceNameFromQuery, setSelectedNode]);

    useEffect(() => {
        const availableFilters = ['정기점검', '장애조치', '기술지원', '구축', '기관정보', '점검서 관리'];
        if (workTypeFromQuery && availableFilters.includes(workTypeFromQuery)) {
            setFilter(workTypeFromQuery);
        }
    }, [workTypeFromQuery]);

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
        if (!serviceId) {
            setIsLegacyService(false);
            return;
        }

        fetch(`/api/legacy-service/check?serviceId=${serviceId}`)
            .then((res) => res.json())
            .then((data) => setIsLegacyService(!!data.legacy))
            .catch((err) => {
                console.error(err);
                setIsLegacyService(false);
            });
    }, [serviceId]);

    useEffect(() => {
        if (filter === '기관정보') {
            fetchManagers();
        }
        if (filter === '점검서 관리') {
            fetchReportRows();
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
                sx={{ display: 'flex', flexDirection: 'column', my: { xs: 10, md: 16 }, gap: 2, alignItems: 'stretch', px: { xs: 2, sm: 3, md: 4 } }}>
                <HistoryHeader selectedNode={effectiveSelectedNode} rows={isReportView ? filteredReportRows : rows} />
                {isGlobalView ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: { xs: 220, md: 300 }, px: 1.5 }}>
                        <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center' }}>
                            좌측 메뉴에서 사이트 / 서비스를 선택해주세요
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <HistoryActions 
                            filter={filter} 
                            setFilter={setFilter} 
                            isGlobalView={isGlobalView} 
                            canRegister={!isLegacyService && !isReportView}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            selectedNode={effectiveSelectedNode}
                        />
                        <HistoryList 
                            rows={isReportView ? filteredReportRows : filter === '기관정보' ? managerRows : filteredRows}
                            isGlobalView={isGlobalView} 
                            onRefresh={isReportView ? fetchReportRows : filter === '기관정보' ? fetchManagers : fetchRows}
                            filter={filter} 
                            targetHistoryId={historyIdFromQuery}
                        />
                    </>
                )}
            </Container>

            
        </>        
    );
}
