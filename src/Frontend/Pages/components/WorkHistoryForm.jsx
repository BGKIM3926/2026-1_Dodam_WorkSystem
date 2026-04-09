import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    Chip,
    FormControl,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const styles = {
    container: {
        width: '100%',
        maxWidth: '700px',
        ml: 0,
        px: { xs: 2, sm: 3, md: 4 },
        py: 4,
    },
    titleSection: {
        mb: 4,
    },
    title: {
        fontSize: '32px',
        fontWeight: 600,
        color: '#18181b',
        mb: 1,
    },
    subtitle: {
        fontSize: '14px',
        fontWeight: 400,
        color: '#71717a',
    },
    formSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    fieldLabel: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#18181b',
        mb: 1,
        letterSpacing: '0.5px',
    },
    fieldInput: {
        '& .MuiOutlinedInput-root': {
            height: '44px',
            fontSize: '15px',
            borderRadius: '8px',
            border: '1.5px solid #e4e4e7',
            '&:hover': {
                borderColor: '#d4d4d8',
            },
            '&.Mui-focused': {
                borderColor: '#2563eb',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
            },
        },
        '& .MuiOutlinedInput-input': {
            padding: '12px',
            color: '#18181b',
            '&::placeholder': {
                color: '#a1a1aa',
                opacity: 1,
            },
        },
    },
    textareaInput: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            border: '1.5px solid #e4e4e7',
            fontSize: '15px',
            minHeight: '420px',
            '&:hover': {
                borderColor: '#d4d4d8',
            },
            '&.Mui-focused': {
                borderColor: '#2563eb',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
            },
        },
        '& .MuiOutlinedInput-input': {
            padding: '12px',
            color: '#18181b',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            '&::placeholder': {
                color: '#a1a1aa',
                opacity: 1,
            },
        },
    },
    selectInput: {
        '& .MuiOutlinedInput-root': {
            height: '44px',
            borderRadius: '8px',
            border: '1.5px solid #e4e4e7',
            fontSize: '15px',
            '&:hover': {
                borderColor: '#d4d4d8',
            },
            '&.Mui-focused': {
                borderColor: '#2563eb',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
            },
        },
        '& .MuiOutlinedInput-input': {
            padding: '12px',
            color: '#18181b',
        },
    },
    buttonSection: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'space-between',
        mt: 5,
    },
    backButton: {
        width: '140px',
        height: '44px',
        borderRadius: '8px',
        border: '1.5px solid #e4e4e7',
        color: '#18181b',
        fontWeight: 600,
        fontSize: '14px',
        textTransform: 'none',
        '&:hover': {
            borderColor: '#d4d4d8',
            backgroundColor: '#fafafa',
        },
    },
    submitButton: {
        width: '140px',
        height: '44px',
        borderRadius: '8px',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        fontWeight: 600,
        fontSize: '14px',
        textTransform: 'none',
        '&:hover': {
            backgroundColor: '#1d4ed8',
        },
        '&:active': {
            backgroundColor: '#1e40af',
        },
    },
};

export default function WorkHistoryForm({ form, setForm, onSubmit, systems, files, setFiles }) {
    const navigate = useNavigate();

    const workTypeOptions = ['정기점검', '장애조치', '기술지원', '구축'];

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prev) => {
            const updated = [...prev, ...droppedFiles];
            if (form.workType === '정기점검') {
                const names = updated.map((f) => f.name).join('\n');
                setForm((prevForm) => ({ ...prevForm, issue: names }));
            }
            return updated;
        });
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        setFiles((prev) => {
            const updated = [...prev, ...selected];
            if (form.workType === '정기점검') {
                const names = updated.map((f) => f.name).join('\n');
                setForm((prevForm) => ({ ...prevForm, issue: names }));
            }
            return updated;
        });
    };


    return (
        <Box sx={styles.container} component="form" noValidate autoComplete="off">
            {/* 제목 영역 */}
            <Box sx={styles.titleSection}>
                <Typography sx={styles.title}>이력 등록</Typography>
                <Typography sx={styles.subtitle}>새 작업 기록을 등록합니다</Typography>
            </Box>

            {/* 입력 폼 영역 */}
            <Box sx={styles.formSection}>
                {/* 작업 유형 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>작업 유형</Typography>
                    <FormControl fullWidth>
                        <Select
                            value={form.workType || ''}
                            displayEmpty
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '정기점검') {
                                    setForm({ ...form, workType: value, systemIds: [] });
                                } else {
                                    setForm({ ...form, workType: value });
                                }
                            }}
                            sx={styles.selectInput}
                        >
                            <MenuItem value="" disabled>
                                작업유형 선택
                            </MenuItem>
                            {workTypeOptions.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* 시스템 (정기점검이 아닐 때만 표시) */}
                {form.workType !== '정기점검' && (
                    <Box>
                        <Typography sx={styles.fieldLabel}>시스템 (복수 선택 가능)</Typography>
                        <FormControl fullWidth>
                            <Select
                                multiple
                                value={form.systemIds || []}
                                displayEmpty
                                onChange={(e) =>
                                    setForm({ ...form, systemIds: e.target.value })
                                }
                                sx={styles.selectInput}
                                renderValue={(selected) => {
                                    if (selected.length === 0) {
                                        return <em style={{ color: '#a1a1aa' }}>시스템 선택</em>;
                                    }
                                    return (
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {selected.map((id) => {
                                                const sys = systems.find(s => s.systemID === id);
                                                return <Chip key={id} label={sys?.systemNameMin || id} size="small" />;
                                            })}
                                        </Box>
                                    );
                                }}
                            >
                                {systems.map((sys) => (
                                    <MenuItem key={sys.systemId} value={sys.systemID}>
                                        {sys.systemNameMin}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}

                {/* 내용 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>내용</Typography>
                    <TextField
                        fullWidth
                        placeholder="작업 내용을 간략하게 입력하세요"
                        value={form.issue || ''}
                        onChange={(e) =>
                            setForm({ ...form, issue: e.target.value })
                        }
                        sx={styles.fieldInput}
                    />
                </Box>

                {/* 내용 상세 */}
                {form.workType !== '정기점검' && (
                    <Box>
                        <Typography sx={styles.fieldLabel}>내용 상세</Typography>
                        <TextField
                            fullWidth
                            placeholder="작업 내용을 자세히 입력하세요"
                            multiline
                            minRows={15}
                            maxRows={Infinity}
                            value={form.issueDetail || ''}
                            onChange={(e) =>
                                setForm({ ...form, issueDetail: e.target.value })
                            }
                            sx={styles.textareaInput}
                        />
                    </Box>
                )}

                {/* 구축기간 (구축일 때만 표시) */}
                {form.workType === '구축' && (
                    <Box>
                        <Typography sx={styles.fieldLabel}>구축기간</Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DatePicker
                                    label="시작일"
                                    value={form.constructionStartDate ? dayjs(form.constructionStartDate) : null}
                                    onChange={(newValue) => setForm({ ...form, constructionStartDate: newValue ? newValue.format('YYYY-MM-DD') : null })}
                                    format="YYYY-MM-DD"
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            sx: styles.fieldInput
                                        }
                                    }}
                                />
                                <DatePicker
                                    label="종료일"
                                    value={form.constructionEndDate ? dayjs(form.constructionEndDate) : null}
                                    onChange={(newValue) => setForm({ ...form, constructionEndDate: newValue ? newValue.format('YYYY-MM-DD') : null })}
                                    format="YYYY-MM-DD"
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            sx: styles.fieldInput
                                        }
                                    }}
                                />
                            </Box>
                        </LocalizationProvider>
                    </Box>
                )}

                {/* 첨부파일 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>첨부파일</Typography>

                    <Paper
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        sx={{
                            p: 3,
                            textAlign: 'center',
                            border: '2px dashed #ccc',
                            cursor: 'pointer',
                        }}
                    >
                        <CloudUploadIcon fontSize="large" />
                        <Typography>파일을 드래그하거나 클릭해서 업로드</Typography>

                        <Button component="label" variant="outlined" sx={{ mt: 2 }}>
                            파일 선택
                            <input hidden multiple type="file" onChange={handleFileChange} />
                        </Button>
                    </Paper>

                    {files.map((file, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Typography sx={{ flex: 1 }}>📎 {file.name}</Typography>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => setFiles((prev) => {
                                    const updated = prev.filter((_, i) => i !== idx);
                                    if (form.workType === '정기점검') {
                                        const names = updated.map((f) => f.name).join('\n');
                                        setForm((prevForm) => ({ ...prevForm, issue: names }));
                                    }
                                    return updated;
                                })}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            </Box>

            

            {/* 버튼 영역 */}
            <Stack direction="row" sx={styles.buttonSection}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/dashboard/workhistory')}
                    sx={styles.backButton}
                >
                    뒤로가기
                </Button>

                <Button onClick={onSubmit} sx={styles.submitButton}>
                    등록
                </Button>
            </Stack>
        </Box>
    );
}