import { Alert, Box, Snackbar } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateUserForm from './CreateUserForm';

export default function CreateUser() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        id: '',
        password: '',
        name: '',
        role: 'USER'
    });

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });

    

    const handleSubmit = async () => {
        if (!form.id || !form.password || !form.name) {
            setSnackbar({ open: true, message: '모든 값을 입력하세요', severity: 'warning' });
            return;
        }

        try {
            console.log('🔥 form:', form);

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                let message = '등록 실패';

                try {
                    const data = await res.json();

                    if (data?.message?.includes('이미 존재')) {
                        message = '이미 사용 중인 ID입니다';
                    } else if (typeof data === 'string' && data.includes('이미 존재')) {
                        message = '이미 사용 중인 ID입니다';
                    }
                } catch (err) {
                    console.warn('응답 파싱 실패:', err);
                }

                alert(message);
                return;
            }

            setSnackbar({ open: true, message: '사용자 등록 완료', severity: 'success' });
            setTimeout(() => navigate('/dashboard/users'), 1000);
        } catch (err) {
            console.error('사용자 등록 중 오류:', err);
            setSnackbar({ open: true, message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', severity: 'error' });
        }
    };

    return (
        <Box
            sx={{ width: '100%', ml: 0, mt: 3 }}
        >
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <CreateUserForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
            />
        </Box>
    );
}