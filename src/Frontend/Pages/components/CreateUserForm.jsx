import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    Box,
    Button,
    FormControl,
    MenuItem,
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
        fontSize: { xs: '28px', md: '32px' },
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
        flexDirection: { xs: 'column', sm: 'row' },
        gap: '12px',
        justifyContent: 'space-between',
        mt: 5,
    },
    backButton: {
        width: { xs: '100%', sm: '140px' },
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
        width: { xs: '100%', sm: '140px' },
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

export default function CreateUserForm({ form, setForm, onSubmit }) {
    const navigate = useNavigate();

    return (
        <Box sx={styles.container} component="form" noValidate autoComplete="off">
            {/* 제목 */}
            <Box sx={styles.titleSection}>
                <Typography sx={styles.title}>사용자 추가</Typography>
                <Typography sx={styles.subtitle}>
                    새 사용자를 등록합니다
                </Typography>
            </Box>

            {/* 폼 */}
            <Box sx={styles.formSection}>
                {/* 권한 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>권한</Typography>
                    <FormControl fullWidth>
                        <Select
                            value={form.role || ''}
                            displayEmpty
                            onChange={(e) =>
                                setForm({ ...form, role: e.target.value })
                            }
                            sx={styles.selectInput}
                        >
                            <MenuItem value="" disabled>
                                권한 선택
                            </MenuItem>
                            <MenuItem value="관리자">관리자</MenuItem>
                            <MenuItem value="팀장">팀장</MenuItem>
                            <MenuItem value="일반사용자">일반사용자</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                
                {/* 이름 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>이름</Typography>
                    <TextField
                        fullWidth
                        placeholder="이름을 입력하세요"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                        sx={styles.fieldInput}
                    />
                </Box>

                {/* 이메일 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>이메일</Typography>
                    <TextField
                        fullWidth
                        type="email"
                        placeholder="이메일을 입력하세요"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                        sx={styles.fieldInput}
                    />
                </Box>

                {/* ID */}
                <Box>
                    <Typography sx={styles.fieldLabel}>ID</Typography>
                    <TextField
                        fullWidth
                        placeholder="ID를 입력하세요"
                        value={form.id}
                        onChange={(e) =>
                            setForm({ ...form, id: e.target.value })
                        }
                        sx={styles.fieldInput}
                    />
                </Box>

                {/* 비밀번호 */}
                <Box>
                    <Typography sx={styles.fieldLabel}>비밀번호</Typography>
                    <TextField
                        fullWidth
                        type="password"
                        autoComplete="new-password"
                        placeholder="비밀번호를 입력하세요"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                        sx={styles.fieldInput}
                    />
                </Box>
            </Box>

            {/* 버튼 */}
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={styles.buttonSection}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/dashboard/users')}
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
