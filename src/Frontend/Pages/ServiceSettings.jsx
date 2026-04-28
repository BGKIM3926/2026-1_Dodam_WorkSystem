import DeleteIcon from '@mui/icons-material/Delete';
import {
    Alert,
    Box,
    Checkbox,
    Chip,
    Container,
    FormControl,
    IconButton,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceSettings() {
    const [activeTab, setActiveTab] = useState('service');

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [customerFilter, setCustomerFilter] = useState('');
    const [page, setPage] = useState(1);

    const [systemRows, setSystemRows] = useState([]);
    const [systemLoading, setSystemLoading] = useState(false);
    const [systemCustomerFilter, setSystemCustomerFilter] = useState('');
    const [systemServiceFilter, setSystemServiceFilter] = useState('');
    const [systemPage, setSystemPage] = useState(1);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const navigate = useNavigate();
    const rowsPerPage = 10;

    const legacyRows = useMemo(() => rows.filter((row) => row.legacy), [rows]);
    const customerOptions = useMemo(
        () => [...new Set(rows.map((row) => row.customerName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')),
        [rows],
    );
    const filteredRows = useMemo(
        () => (customerFilter ? rows.filter((row) => row.customerName === customerFilter) : rows),
        [rows, customerFilter],
    );
    const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
    const pagedRows = useMemo(
        () => filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage),
        [filteredRows, page],
    );
    const allCheckedInPage = pagedRows.length > 0 && pagedRows.every((row) => row.legacy);
    const someCheckedInPage = pagedRows.some((row) => row.legacy) && !allCheckedInPage;

    const versionLegacyRows = useMemo(() => systemRows.filter((row) => row.version === '구'), [systemRows]);
    const systemCustomerOptions = useMemo(
        () => [...new Set(systemRows.map((row) => row.customerName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')),
        [systemRows],
    );
    const systemServiceOptions = useMemo(() => {
        const baseRows = systemCustomerFilter
            ? systemRows.filter((row) => row.customerName === systemCustomerFilter)
            : systemRows;
        return [...new Set(baseRows.map((row) => row.serviceNameMin || row.serviceName).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'ko'));
    }, [systemRows, systemCustomerFilter]);
    const filteredSystemRows = useMemo(() => {
        if (!systemCustomerFilter || !systemServiceFilter) return [];
        return systemRows.filter(
            (row) =>
                row.customerName === systemCustomerFilter &&
                (row.serviceNameMin || row.serviceName) === systemServiceFilter,
        );
    }, [systemRows, systemCustomerFilter, systemServiceFilter]);
    const systemPageCount = Math.max(1, Math.ceil(filteredSystemRows.length / rowsPerPage));
    const pagedSystemRows = useMemo(
        () => filteredSystemRows.slice((systemPage - 1) * rowsPerPage, systemPage * rowsPerPage),
        [filteredSystemRows, systemPage],
    );

    const fetchRows = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/legacy-service/options');
            const data = await res.json();
            setRows(data);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: '목록 조회에 실패했습니다.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemRows = async () => {
        setSystemLoading(true);
        try {
            const res = await fetch('/api/dsystem/version-options');
            const data = await res.json();
            setSystemRows(data);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: '시스템 목록 조회에 실패했습니다.', severity: 'error' });
        } finally {
            setSystemLoading(false);
        }
    };

    useEffect(() => {
        const user = localStorage.getItem('loginUser');
        if (!user) {
            navigate('/');
            return;
        }
        fetchRows();
        fetchSystemRows();
    }, [navigate]);

    useEffect(() => {
        if (page > pageCount) {
            setPage(pageCount);
        }
    }, [page, pageCount]);

    useEffect(() => {
        if (systemPage > systemPageCount) {
            setSystemPage(systemPageCount);
        }
    }, [systemPage, systemPageCount]);

    const refreshAndNotify = async () => {
        await fetchRows();
        window.dispatchEvent(new Event('legacy-services-updated'));
    };

    const refreshSystemsAndNotify = async () => {
        await fetchSystemRows();
        window.dispatchEvent(new Event('system-version-updated'));
    };

    const handleToggleLegacy = async (row, checked) => {
        try {
            if (checked) {
                await fetch('/api/legacy-service', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ serviceId: row.serviceId }),
                });
            } else {
                await fetch(`/api/legacy-service/${row.serviceId}`, {
                    method: 'DELETE',
                });
            }
            await refreshAndNotify();
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: '설정 저장에 실패했습니다.', severity: 'error' });
        }
    };

    const handleToggleAllInPage = async (checked) => {
        try {
            const targets = pagedRows.filter((row) => !!row.legacy !== checked);
            if (targets.length === 0) return;

            await Promise.all(
                targets.map((row) =>
                    checked
                        ? fetch('/api/legacy-service', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ serviceId: row.serviceId }),
                          })
                        : fetch(`/api/legacy-service/${row.serviceId}`, { method: 'DELETE' }),
                ),
            );

            await refreshAndNotify();
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: '전체 선택 적용에 실패했습니다.', severity: 'error' });
        }
    };

    const handleRemoveLegacy = async (serviceId) => {
        try {
            await fetch(`/api/legacy-service/${serviceId}`, {
                method: 'DELETE',
            });
            await refreshAndNotify();
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: '삭제에 실패했습니다.', severity: 'error' });
        }
    };

    const handleToggleSystemVersion = async (row, checked) => {
        try {
            await fetch(`/api/dsystem/${row.systemID}/version`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ version: checked ? '구' : '신' }),
            });
            await refreshSystemsAndNotify();
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: '시스템 버전 저장에 실패했습니다.', severity: 'error' });
        }
    };

    const handleRemoveLegacySystem = async (systemId) => {
        try {
            await fetch(`/api/dsystem/${systemId}/version`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ version: '신' }),
            });
            await refreshSystemsAndNotify();
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: '삭제에 실패했습니다.', severity: 'error' });
        }
    };

    return (
        <Container
            maxWidth={false}
            component="main"
            disableGutters
            sx={{ display: 'flex', flexDirection: 'column', my: { xs: 10, md: 16 }, gap: 3, alignItems: 'stretch', px: { xs: 2, sm: 3, md: 4 } }}
        >
            <Typography variant="h2" sx={{ mt: { xs: 1, md: 4 } }}>
                설정
            </Typography>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip
                    label="서비스 설정"
                    clickable
                    color={activeTab === 'service' ? 'primary' : 'default'}
                    variant={activeTab === 'service' ? 'filled' : 'outlined'}
                    size="large"
                    sx={{ flexShrink: 0 }}
                    onClick={() => setActiveTab('service')}
                />
                <Chip
                    label="시스템 버전 설정"
                    clickable
                    color={activeTab === 'systemVersion' ? 'primary' : 'default'}
                    variant={activeTab === 'systemVersion' ? 'filled' : 'outlined'}
                    size="large"
                    sx={{ flexShrink: 0 }}
                    onClick={() => setActiveTab('systemVersion')}
                />
            </Stack>

            {activeTab === 'service' && (
                <>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1.5 }}>
                            사용하지 않는 서비스 설정
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            체크한 서비스는 작업 종료로 분류되어 이력 등록 대상에서 제외됩니다.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                                <Select
                                    value={customerFilter}
                                    displayEmpty
                                    onChange={(e) => {
                                        setCustomerFilter(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <MenuItem value="">전체 고객사</MenuItem>
                                    {customerOptions.map((customer) => (
                                        <MenuItem key={customer} value={customer}>
                                            {customer}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Typography variant="body2" color="text.secondary">
                                총 {filteredRows.length}건
                            </Typography>
                        </Stack>

                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: { xs: 520, sm: 'auto' } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: 140 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Checkbox
                                                    checked={allCheckedInPage}
                                                    indeterminate={someCheckedInPage}
                                                    onChange={(e) => handleToggleAllInPage(e.target.checked)}
                                                    disabled={loading || pagedRows.length === 0}
                                                />
                                                전체 선택
                                            </Box>
                                        </TableCell>
                                        <TableCell>고객사</TableCell>
                                        <TableCell>서비스명</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pagedRows.map((row) => (
                                        <TableRow key={row.serviceId}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={!!row.legacy}
                                                    onChange={(e) => handleToggleLegacy(row, e.target.checked)}
                                                    disabled={loading}
                                                />
                                            </TableCell>
                                            <TableCell>{row.customerName || '-'}</TableCell>
                                            <TableCell>{row.serviceName || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {pagedRows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>
                                                표시할 서비스가 없습니다.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {pageCount > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Pagination count={pageCount} page={page} onChange={(event, nextPage) => setPage(nextPage)} />
                            </Box>
                        )}
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1.5 }}>
                            사용하지 않는 서비스 목록
                        </Typography>

                        {legacyRows.length === 0 ? (
                            <Typography color="text.secondary">등록된 서비스가 없습니다.</Typography>
                        ) : (
                            <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table size="small" sx={{ minWidth: { xs: 420, sm: 'auto' } }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>고객사</TableCell>
                                            <TableCell>서비스명</TableCell>
                                            <TableCell sx={{ width: 80 }}>삭제</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {legacyRows.map((row) => (
                                            <TableRow key={`legacy-${row.serviceId}`}>
                                                <TableCell>{row.customerName || '-'}</TableCell>
                                                <TableCell>{row.serviceName || '-'}</TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveLegacy(row.serviceId)}
                                                        disabled={loading}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </>
            )}

            {activeTab === 'systemVersion' && (
                <>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1.5 }}>
                            시스템 버전 설정
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            체크한 시스템은 구버전으로 분류됩니다.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                                <Select
                                    value={systemCustomerFilter}
                                    displayEmpty
                                    onChange={(e) => {
                                        setSystemCustomerFilter(e.target.value);
                                        setSystemServiceFilter('');
                                        setSystemPage(1);
                                    }}
                                >
                                    <MenuItem value="">사이트명 선택</MenuItem>
                                    {systemCustomerOptions.map((customer) => (
                                        <MenuItem key={customer} value={customer}>
                                            {customer}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                                <Select
                                    value={systemServiceFilter}
                                    displayEmpty
                                    onChange={(e) => {
                                        setSystemServiceFilter(e.target.value);
                                        setSystemPage(1);
                                    }}
                                    disabled={!systemCustomerFilter}
                                >
                                    <MenuItem value="">서비스명 선택</MenuItem>
                                    {systemServiceOptions.map((service) => (
                                        <MenuItem key={service} value={service}>
                                            {service}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Typography variant="body2" color="text.secondary">
                                총 {filteredSystemRows.length}건
                            </Typography>
                        </Stack>

                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: { xs: 720, sm: 'auto' } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: 100 }}>구버전</TableCell>
                                        <TableCell>사이트명</TableCell>
                                        <TableCell>서비스명</TableCell>
                                        <TableCell>시스템명</TableCell>
                                        <TableCell>OS IP</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pagedSystemRows.map((row) => (
                                        <TableRow key={row.systemID}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={row.version === '구'}
                                                    onChange={(e) => handleToggleSystemVersion(row, e.target.checked)}
                                                    disabled={systemLoading}
                                                />
                                            </TableCell>
                                            <TableCell>{row.customerName || '-'}</TableCell>
                                            <TableCell>{row.serviceNameMin || row.serviceName || '-'}</TableCell>
                                            <TableCell>{row.systemNameMin || row.systemName || '-'}</TableCell>
                                            <TableCell>{row.osIp || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {pagedSystemRows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>
                                                사이트명과 서비스명을 선택해 주세요.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {systemPageCount > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Pagination count={systemPageCount} page={systemPage} onChange={(event, nextPage) => setSystemPage(nextPage)} />
                            </Box>
                        )}
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1.5 }}>
                            구버전 시스템 목록
                        </Typography>

                        {versionLegacyRows.length === 0 ? (
                            <Typography color="text.secondary">등록된 구버전 시스템이 없습니다.</Typography>
                        ) : (
                            <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table size="small" sx={{ minWidth: { xs: 720, sm: 'auto' } }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>사이트명</TableCell>
                                            <TableCell>서비스명</TableCell>
                                            <TableCell>시스템명</TableCell>
                                            <TableCell>OS IP</TableCell>
                                            <TableCell sx={{ width: 80 }}>삭제</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {versionLegacyRows.map((row) => (
                                            <TableRow key={`version-legacy-${row.systemID}`}>
                                                <TableCell>{row.customerName || '-'}</TableCell>
                                                <TableCell>{row.serviceNameMin || row.serviceName || '-'}</TableCell>
                                                <TableCell>{row.systemNameMin || row.systemName || '-'}</TableCell>
                                                <TableCell>{row.osIp || '-'}</TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveLegacySystem(row.systemID)}
                                                        disabled={systemLoading}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={2500}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
