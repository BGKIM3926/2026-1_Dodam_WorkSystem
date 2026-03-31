import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
    Box,
    Button,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
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
        setFiles((prev) => [...prev, ...droppedFiles]);
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selected]);
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
                {/* 시스템 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>시스템</Typography>
                    <FormControl fullWidth>
                        <Select
                            value={form.systemId || ''}
                            displayEmpty
                            onChange={(e) =>
                                setForm({ ...form, systemId: e.target.value })
                            }
                            sx={styles.selectInput}
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
                </Box>

                {/* 작업 유형 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>작업 유형</Typography>
                    <FormControl fullWidth>
                        <Select
                            value={form.workType || ''}
                            displayEmpty
                            onChange={(e) =>
                                setForm({ ...form, workType: e.target.value })
                            }
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

                {/* 장비 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>장비</Typography>
                    <TextField
                        fullWidth
                        placeholder="장비명을 입력하세요"
                        value={form.equipment || ''}
                        onChange={(e) =>
                            setForm({ ...form, equipment: e.target.value })
                        }
                        sx={styles.fieldInput}
                    />
                </Box>

                {/* 내용 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>내용</Typography>
                    <TextField
                        fullWidth
                        placeholder="작업 내용을 자세히 입력하세요"
                        multiline
                        minRows={15}
                        maxRows={Infinity}
                        value={form.issue || ''}
                        onChange={(e) =>
                            setForm({ ...form, issue: e.target.value })
                        }
                        sx={styles.textareaInput}
                    />
                </Box>

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
                        <Typography key={idx}>{file.name}</Typography>
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