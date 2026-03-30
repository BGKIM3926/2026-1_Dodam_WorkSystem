import AddIcon from '@mui/icons-material/Add';
import { Box, Button } from '@mui/material';
import Chip from '@mui/material/Chip';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';

export default function HistoryActions({ filter, setFilter, isGlobalView, startDate, setStartDate, endDate, setEndDate }) {

    const navigate = useNavigate();

    const { selectedNode } = useSelectedNode();

    const serviceName = selectedNode?.serviceName;
    const customerName = selectedNode?.customerName;

    

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                width: '100%',
                gap: 4
            }}
        >
            <Box
                sx={{
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap'
                }}
            >
                <Chip
                    onClick={() => setFilter('전체')}
                    color={filter === '전체' ? 'primary' : 'default'}
                    size="large"
                    label="전체"
                />
                <Chip 
                    onClick={() => setFilter('정기점검')} 
                    color={filter === '정기점검' ? 'primary' : 'default'}
                    size="large" 
                    label="정기점검" 
                />
                <Chip
                    onClick={() => setFilter('장애조치')}
                    color={filter === '장애조치' ? 'primary' : 'default'}
                    size="large"
                    label="장애조치"                    
                />
                <Chip
                    onClick={() => setFilter('기술지원')}
                    color={filter === '기술지원' ? 'primary' : 'default'}
                    size="large"
                    label="기술지원"
                />
                <Chip
                    onClick={() => setFilter('구축')}
                    color={filter === '구축' ? 'primary' : 'default'}
                    size="large"
                    label="구축"
                />
            </Box>
            
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: { xs: 2, md: 3 },
                    alignItems: { xs: 'stretch', md: 'center' },
                    justifyContent: 'flex-end',
                    width: { xs: '100%', md: 'auto' }
                }}
            >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 2 }, alignItems: 'stretch' }}>
                        <Box sx={{ display: 'flex', gap: 1, minWidth: { xs: 'auto', sm: '150px' } }}>
                            <DatePicker
                                label='시작일'
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                format="YYYY-MM-DD"
                                slotProps={{
                                    textField: {
                                        size: 'medium',
                                        fullWidth: true,
                                        sx: { minWidth: '140px' }
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
                        <Box sx={{ display: 'flex', gap: 1, minWidth: { xs: 'auto', sm: '150px' } }}>
                            <DatePicker
                                label='종료일'
                                value={endDate}
                                onChange={(newValue) => {
                                    if (startDate && newValue && newValue.isBefore(startDate)) {
                                        alert('종료일은 시작일보다 이후여야 합니다.');
                                        return;
                                    }
                                    setEndDate(newValue);
                                }}
                                format="YYYY-MM-DD"
                                slotProps={{
                                    textField: {
                                        size: 'medium',
                                        fullWidth: true,
                                        sx: { minWidth: '140px' }
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

                {!isGlobalView && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        size="medium"
                        sx={{ whiteSpace: 'nowrap' }}
                        onClick={() => {
                            if (!serviceName) {
                                alert('시스템을 먼저 선택하세요');
                                return;
                            }

                            navigate(
                                `/dashboard/workhistory/createWorkHistory`
                            );
                        }}
                    >
                        이력 등록
                    </Button>
                )}
            </Box>
        </Box>
    );
}