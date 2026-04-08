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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const workTypeColor = {
    '정기점검': 'info',
    '장애조치': 'error',
    '기술지원': 'warning',
    '구축': 'success',
};

const workTypeIcon = {
    '정기점검': <CalendarMonthIcon fontSize="small" />,
    '장애조치': <ErrorOutlineIcon fontSize="small" />,
    '기술지원': <BuildIcon fontSize="small" />,
    '구축': <AssignmentIcon fontSize="small" />,
};

export default function Home() {
    const [summary, setSummary] = useState({});
    const [missingInspections, setMissingInspections] = useState([]);
    const [recentHistory, setRecentHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('loginUser');
        if (!user) return;

        const parsed = JSON.parse(user);
        const workerId = parsed.id || parsed.userId;
        if (!workerId) return;

        fetch(`http://localhost:8080/api/stats/summary?workerId=${workerId}`)
            .then(res => res.json())
            .then(data => setSummary(data))
            .catch(console.error);

        fetch(`http://localhost:8080/api/stats/missing-inspections?workerId=${workerId}`)
            .then(res => res.json())
            .then(data => setMissingInspections(data))
            .catch(console.error);

        fetch(`http://localhost:8080/api/stats/recent?workerId=${workerId}`)
            .then(res => res.json())
            .then(data => setRecentHistory(data))
            .catch(console.error);
    }, []);

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
            label: '이번 달 처리',
            value: summary.monthlyCount ?? '-',
            icon: <CalendarMonthIcon sx={{ fontSize: 32, color: 'info.main' }} />,
            color: 'info.main',
            bgColor: 'info.50',
        },
        {
            label: '미완료',
            value: summary.incompleteCount ?? '-',
            icon: <ErrorOutlineIcon sx={{ fontSize: 32, color: 'warning.main' }} />,
            color: 'warning.main',
            bgColor: 'warning.50',
        },
        {
            label: '점검 누락',
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
                    대시보드
                </Typography>
            </Box>

            {/* 통계 카드 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                {statCards.map((card) => (
                    <Card
                        key={card.label}
                        variant="outlined"
                        sx={{ borderRadius: 2, ...(card.link && { cursor: 'pointer', '&:hover': { boxShadow: 2 } }) }}
                        onClick={card.link ? () => navigate(card.link) : undefined}
                    >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, '&:last-child': { pb: 2.5 } }}>
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 52, height: 52, borderRadius: 2,
                                backgroundColor: card.bgColor,
                            }}>
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

            {/* 점검 미실시 목록 */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2 }}>
                        <WarningAmberIcon color="error" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            이번 달 정기점검 미실시 목록
                        </Typography>
                        <Chip
                            label={`${missingInspections.length}건`}
                            color="error"
                            size="small"
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>
                    <Divider />
                    {missingInspections.length > 0 ? (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'error.50' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>사이트명</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>서비스명</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>최근 점검일</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {missingInspections.map((row, idx) => (
                                        <TableRow key={idx} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                                            <TableCell>{row.region || '-'}</TableCell>
                                            <TableCell>{row.serviceName || '-'}</TableCell>
                                            <TableCell>
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
                    ) : (
                        <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography color="text.secondary">
                                이번 달 모든 서비스의 정기점검이 완료되었습니다.
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* 최근 등록 이력 */}
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
                                    sx={{ px: 3, py: 1.5 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        {workTypeIcon[item.workType] || <AssignmentIcon fontSize="small" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
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
                                        }
                                        secondary={`${item.region || ''} / ${item.serviceName || ''} · ${item.visitDate || ''}`}
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