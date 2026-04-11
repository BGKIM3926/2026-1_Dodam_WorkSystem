import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    FormControl,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Pagination,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedNode } from '../Contexts/SelectedNodeContext';

const workTypeColor = {
    정기점검: 'info',
    장애조치: 'error',
    기술지원: 'warning',
    구축: 'success',
};

const workTypeIcon = {
    정기점검: <CalendarMonthIcon fontSize="small" />,
    장애조치: <ErrorOutlineIcon fontSize="small" />,
    기술지원: <BuildIcon fontSize="small" />,
    구축: <AssignmentIcon fontSize="small" />,
};

export default function Home() {
    const [summary, setSummary] = useState({});
    const [missingInspections, setMissingInspections] = useState([]);
    const [siteOptions, setSiteOptions] = useState([]);
    const [selectedSite, setSelectedSite] = useState('');
    const [recentHistory, setRecentHistory] = useState([]);
    const [inspectionPage, setInspectionPage] = useState(1);
    const inspectionRowsPerPage = 10;
    const navigate = useNavigate();
    const { setSelectedNode } = useSelectedNode();

    useEffect(() => {
        fetch('/api/stats/summary')
            .then((res) => res.json())
            .then((data) => setSummary(data))
            .catch(console.error);

        fetch('/api/stats/missing-inspections')
            .then((res) => res.json())
            .then((data) => setMissingInspections(data))
            .catch(console.error);

        fetch('/api/dsystem')
            .then((res) => res.json())
            .then((data) => {
                const sites = [...new Set(data.map((item) => item.customerName).filter(Boolean))]
                    .sort((a, b) => a.localeCompare(b, 'ko'));
                setSiteOptions(sites);
            })
            .catch(console.error);

        fetch('/api/stats/recent')
            .then((res) => res.json())
            .then((data) => setRecentHistory(data))
            .catch(console.error);
    }, []);

    const filteredMissingInspections = selectedSite
        ? missingInspections.filter((row) => row.region === selectedSite)
        : missingInspections;

    const pagedMissingInspections = filteredMissingInspections.slice(
        (inspectionPage - 1) * inspectionRowsPerPage,
        inspectionPage * inspectionRowsPerPage,
    );

    const inspectionPageCount = Math.ceil(filteredMissingInspections.length / inspectionRowsPerPage);

    const handleMissingInspectionRowClick = (row) => {
        const customerName = row.region;
        const serviceName = row.serviceName;

        if (!customerName || !serviceName) return;

        setSelectedNode({ customerName, serviceName });

        const params = new URLSearchParams({
            customerName,
            serviceName,
        });

        navigate(`/dashboard/workhistory?${params.toString()}`);
    };

    const handleSiteChange = (event) => {
        setSelectedSite(event.target.value);
        setInspectionPage(1);
    };

    const statCards = [
        {
            label: '전체 이력',
            value: summary.totalCount ?? '-',
            icon: <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
            color: 'primary.main',
            bgColor: 'primary.50',
            link: '/dashboard/workhistory',
        },
        {
            label: '미완료',
            value: summary.incompleteCount ?? '-',
            icon: <ErrorOutlineIcon sx={{ fontSize: 32, color: 'warning.main' }} />,
            color: 'warning.main',
            bgColor: 'warning.50',
        },
        {
            label: '점검 미실시',
            value: summary.missingInspectionCount ?? '-',
            icon: <WarningAmberIcon sx={{ fontSize: 32, color: 'error.main' }} />,
            color: 'error.main',
            bgColor: 'error.50',
        },
    ];

    return (
        <Container
            maxWidth={false}
            component="main"
            disableGutters
            sx={{ display: 'flex', flexDirection: 'column', my: 16, gap: 3, alignItems: 'stretch', px: { xs: 2, sm: 3, md: 4 } }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2, mt: 4, justifyContent: 'flex-start' }}>
                <Typography variant="h2" gutterBottom>
                    홈
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                {statCards.map((card) => (
                    <Card
                        key={card.label}
                        variant="outlined"
                        sx={{ borderRadius: 2, ...(card.link && { cursor: 'pointer', '&:hover': { boxShadow: 2 } }) }}
                        onClick={card.link ? () => navigate(card.link) : undefined}
                    >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, '&:last-child': { pb: 2.5 } }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 52,
                                    height: 52,
                                    borderRadius: 2,
                                    backgroundColor: card.bgColor,
                                }}
                            >
                                {card.icon}
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {card.label}
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: card.color }}>
                                    {card.value}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: { xs: 'stretch', sm: 'center' },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1,
                            px: 3,
                            py: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <WarningAmberIcon color="error" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                이번 달 정기점검 미실시 목록
                            </Typography>
                            <Chip
                                label={`${filteredMissingInspections.length}건`}
                                color="error"
                                size="small"
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>
                        <Box sx={{ ml: { xs: 0, sm: 'auto' }, minWidth: { xs: '100%', sm: 220 } }}>
                            <FormControl size="small" fullWidth>
                                <Select value={selectedSite} displayEmpty onChange={handleSiteChange}>
                                    <MenuItem value="">전체 사이트</MenuItem>
                                    {siteOptions.map((site) => (
                                        <MenuItem key={site} value={site}>
                                            {site}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                    <Divider />
                    {filteredMissingInspections.length > 0 ? (
                        <>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'error.50' }}>
                                            <TableCell sx={{ fontWeight: 700, px: 3, py: 1.5, minWidth: 140 }}>사이트명</TableCell>
                                            <TableCell sx={{ fontWeight: 700, px: 3, py: 1.5, minWidth: 180 }}>서비스명</TableCell>
                                            <TableCell sx={{ fontWeight: 700, px: 3, py: 1.5, minWidth: 160 }}>최근 점검일</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pagedMissingInspections.map((row, idx) => (
                                            <TableRow
                                                key={`${row.region}-${row.serviceName}-${idx}`}
                                                hover
                                                onClick={() => handleMissingInspectionRowClick(row)}
                                                sx={{
                                                    cursor: row.region && row.serviceName ? 'pointer' : 'default',
                                                    '&:hover': { backgroundColor: 'action.hover' },
                                                }}
                                            >
                                                <TableCell sx={{ px: 3, py: 1.5 }}>{row.region || '-'}</TableCell>
                                                <TableCell sx={{ px: 3, py: 1.5 }}>{row.serviceName || '-'}</TableCell>
                                                <TableCell sx={{ px: 3, py: 1.5 }}>
                                                    {row.lastInspectionDate ? (
                                                        <Typography variant="body2">{row.lastInspectionDate}</Typography>
                                                    ) : (
                                                        <Chip label="기록 없음" size="small" color="default" variant="outlined" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {inspectionPageCount > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <Pagination
                                        count={inspectionPageCount}
                                        page={inspectionPage}
                                        onChange={(event, page) => setInspectionPage(page)}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            )}
                        </>
                    ) : (
                        <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography color="text.secondary">
                                {selectedSite
                                    ? `${selectedSite}의 이번 달 정기점검이 모두 완료되었습니다.`
                                    : '이번 달 모든 서비스의 정기점검이 완료되었습니다.'}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Box sx={{ px: 3, py: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            최근 등록 이력
                        </Typography>
                    </Box>
                    <Divider />
                    {recentHistory.length > 0 ? (
                        <List disablePadding>
                            {recentHistory.map((item, idx) => (
                                <ListItem
                                    key={item.historyId}
                                    divider={idx < recentHistory.length - 1}
                                    sx={{ px: 3, py: 1.5, alignItems: 'center' }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36, mr: 1 }}>
                                        {workTypeIcon[item.workType] || <AssignmentIcon fontSize="small" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={(
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={item.workType}
                                                    size="small"
                                                    color={workTypeColor[item.workType] || 'default'}
                                                    sx={{ fontWeight: 600, minWidth: 64 }}
                                                />
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {item.issue || '(내용 없음)'}
                                                </Typography>
                                            </Box>
                                        )}
                                        secondary={(
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Typography variant="caption">{item.region || ''}</Typography>
                                                <Typography variant="caption">/ {item.serviceName || ''}</Typography>
                                                <Typography variant="caption">· {item.visitDate || ''}</Typography>
                                            </Box>
                                        )}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">등록된 이력이 없습니다.</Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}
