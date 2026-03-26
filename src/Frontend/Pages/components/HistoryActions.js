import { Stack, TextField, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import Chip from '@mui/material/Chip';
import { useLocation } from 'react-router-dom';

export default function HistoryActions({ filter, setFilter, isGlobalView }) {

    const navigate = useNavigate();

    const location = useLocation();
    const params = new URLSearchParams(location.search);

    const systemId = params.get('systemId');
    const region = params.get('region');
    const systemName = params.get('systemName');

    

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column-reverse', md: 'row' },
                width: '100%',
                justifyContent: 'space-between',
                alignItems: { xs: 'start', md: 'center' },
                gap: 4,
                overflow: 'auto',
            }}
        >
            <Box
                sx={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    gap: 3,
                    overflow: 'auto',
                }}
            >
                <Chip 
                    onClick={() => setFilter('전체')} 
                    color={filter === '전체' ? 'primary' : 'default'}
                    size="large" 
                    label="전체" 
                />
                <Chip
                    onClick={() => setFilter('신규구축')}
                    color={filter === '신규구축' ? 'primary' : 'default'}
                    size="large"
                    label="신규구축"                    
                />
                <Chip
                    onClick={() => setFilter('장애')}
                    color={filter === '장애' ? 'primary' : 'default'}
                    size="large"
                    label="장애"
                />
                <Chip
                    onClick={() => setFilter('유지보수')}
                    color={filter === '유지보수' ? 'primary' : 'default'}
                    size="large"
                    label="유지보수"
                />
                <Chip
                    onClick={() => setFilter('기타')}
                    color={filter === '기타' ? 'primary' : 'default'}
                    size="large"
                    label="기타"
                />
            </Box>

            {!isGlobalView && (
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/dashboard/workhistory/createWorkHistory?systemId=${systemId}&region=${encodeURIComponent(region)}&systemName=${encodeURIComponent(systemName)}`)}
                >
                    이력 등록
                </Button>
            )}
        </Box>
    );
}