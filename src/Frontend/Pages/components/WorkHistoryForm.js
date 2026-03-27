import {
    Box,
    Grid,
    TextField,
    Button,
    FormControl,
    Select,
    MenuItem,
    Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

export default function WorkHistoryForm({ form, setForm, onSubmit, systems }) {
    const navigate = useNavigate();

    const workTypeOptions = ['정기점검', '장애조치', '기술지원', '구축'];

    return (
        <Box sx={{ width: '100%' }}>

            {/* 제목 */}
            <Typography variant="h6" sx={{ mb: 2 }}>
                이력 등록
            </Typography>

            {/* 🔥 입력 영역 (한 줄) */}
            <Grid container spacing={2} alignItems="center">

                <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                        <Select
                            value={form.systemId || ''}
                            displayEmpty
                            onChange={(e) =>
                                setForm({ ...form, systemId: e.target.value })
                            }
                        >
                            <MenuItem value="" disabled>
                                시스템 선택
                            </MenuItem>

                            {systems.map((sys) => (
                                <MenuItem key={sys.systemId} value={sys.systemID}>
                                    {sys.systemNameMin}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* 작업 유형 */}
                <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                        <Select
                            value={form.workType || ''}
                            displayEmpty
                            onChange={(e) =>
                                setForm({ ...form, workType: e.target.value })
                            }
                        >
                            <MenuItem value="" disabled>
                                작업유형
                            </MenuItem>
                            {workTypeOptions.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* 장비 */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="장비"
                        value={form.equipment || ''}
                        onChange={(e) =>
                            setForm({ ...form, equipment: e.target.value })
                        }
                    />
                </Grid>

                {/* 내용 */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="내용"
                        value={form.issue || ''}
                        onChange={(e) =>
                            setForm({ ...form, issue: e.target.value })
                        }
                    />
                </Grid>

            </Grid>

            {/* 🔥 버튼 영역 */}
            <Box
                sx={{
                    mt: 3,
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/dashboard/workhistory')}
                >
                    뒤로가기
                </Button>

                <Button variant="contained" onClick={onSubmit}>
                    등록
                </Button>
            </Box>
        </Box>
    );
}