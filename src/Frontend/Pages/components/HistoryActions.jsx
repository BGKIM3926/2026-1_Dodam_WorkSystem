import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, Box, Button, IconButton, Snackbar, Tooltip } from '@mui/material';
import Chip from '@mui/material/Chip';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HistoryActions({
    filter,
    setFilter,
    isGlobalView,
    canRegister = true,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedNode,
}) {

    const navigate = useNavigate();

    const serviceName = selectedNode?.serviceName;
    const customerName = selectedNode?.customerName;

    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const chipSx = {
        flexShrink: 0,
    };

    return (
        <>
        <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                severity="warning"
                variant="filled"
            >
                {snackbar.message}
            </Alert>
        </Snackbar>
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                gap: { xs: 1, md: 1.25, xl: 4 },
                overflowX: 'auto',
                overflowY: 'hidden',
                pb: 0.5,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'nowrap',
                    flexShrink: 0,
                }}
            >
                <Chip 
                    onClick={() => setFilter('정기점검')} 
                    color={filter === '정기점검' ? 'primary' : 'default'}
                    size="large"
                    label="정기점검" 
                    sx={chipSx}
                />
                <Chip
                    onClick={() => setFilter('장애조치')}
                    color={filter === '장애조치' ? 'primary' : 'default'}
                    size="large"
                    label="장애조치"                    
                    sx={chipSx}
                />
                <Chip
                    onClick={() => setFilter('기술지원')}
                    color={filter === '기술지원' ? 'primary' : 'default'}
                    size="large"
                    label="기술지원"
                    sx={chipSx}
                />
                <Chip
                    onClick={() => setFilter('구축')}
                    color={filter === '구축' ? 'primary' : 'default'}
                    size="large"
                    label="구축"
                    sx={chipSx}
                />
                <Chip
                    onClick={() => setFilter('기관정보')}
                    color={filter === '기관정보' ? 'primary' : 'default'}
                    size="large"
                    label="기관정보"
                    sx={chipSx}
                />
                <Chip
                    onClick={() => setFilter('점검서 관리')}
                    color={filter === '점검서 관리' ? 'primary' : 'default'}
                    size="large"
                    label="점검서 관리"
                    sx={chipSx}
                />
            </Box>
            
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    gap: 1,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    flex: '0 0 auto',
                    ml: { xs: 1, xl: 'auto' },
                }}
            >
                <Tooltip title="날짜 초기화">
                    <IconButton
                        onClick={() => {
                            setStartDate(null);
                            setEndDate(null);
                        }}
                        size="medium"
                        sx={{ flexShrink: 0 }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                        <Box sx={{ display: 'flex', gap: 1, minWidth: { xs: 'auto', sm: '130px' }, flexShrink: 0 }}>
                            <DatePicker
                                label='시작일'
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                format="YYYY-MM-DD"
                                slotProps={{
                                    textField: {
                                        size: 'medium',
                                        fullWidth: true,
                                        sx: { minWidth: '120px' }
                                    },
                                    openPickerButton: {
                                        sx: {
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            padding: '4px',
                                            '&:hover': {
                                                backgroundColor: 'transparent'
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, minWidth: { xs: 'auto', sm: '130px' }, flexShrink: 0 }}>
                            <DatePicker
                                label='종료일'
                                value={endDate}
                                onChange={(newValue) => {
                                    if (startDate && newValue && newValue.isBefore(startDate)) {
                                        setSnackbar({ open: true, message: '종료일은 시작일보다 이후여야 합니다.' });
                                        return;
                                    }
                                    setEndDate(newValue);
                                }}
                                format="YYYY-MM-DD"
                                slotProps={{
                                    textField: {
                                        size: 'medium',
                                        fullWidth: true,
                                        sx: { minWidth: '120px' }
                                    },
                                    openPickerButton: {
                                        sx: {
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            padding: '4px',
                                            '&:hover': {
                                                backgroundColor: 'transparent'
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                </LocalizationProvider>

                {!isGlobalView && canRegister && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        size="medium"
                        sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={() => {
                            if (!serviceName) {
                                setSnackbar({ open: true, message: '시스템을 먼저 선택하세요' });
                                return;
                            }

                            const params = new URLSearchParams();
                            if (customerName) params.set('customerName', customerName);
                            if (serviceName) params.set('serviceName', serviceName);
                            const suffix = params.toString() ? `?${params.toString()}` : '';

                            if (filter === '기관정보') {
                                navigate(`/dashboard/workhistory/createServiceManager${suffix}`);
                            } else {
                                navigate(`/dashboard/workhistory/createWorkHistory${suffix}`);
                            }
                        }}
                    >
                        {filter === '기관정보' ? '정보 등록' : '이력 등록'}
                    </Button>
                )}
            </Box>
        </Box>
        </>
    );
}
