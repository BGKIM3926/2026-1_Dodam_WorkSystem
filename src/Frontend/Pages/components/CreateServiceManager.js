import { Alert, Box, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';
import ServiceManagerForm from './ServiceManagerForm';

export default function CreateServiceManager() {
    const navigate = useNavigate();
    const { selectedNode } = useSelectedNode();

    const [form, setForm] = useState({
        name: '',
        dept: '',
        phone: '',
        email: '',
    });

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });

    const serviceName = selectedNode?.serviceName;
    const customerName = selectedNode?.customerName;
    const [serviceId, setServiceId] = useState(null);

    useEffect(() => {
        if (!serviceName) {
            setSnackbar({ open: true, message: '잘못된 접근입니다.', severity: 'error' });
            navigate('/dashboard/workhistory');
            return;
        }

        fetch(`http://localhost:8080/api/dsystem/filter?serviceName=${serviceName}&customerName=${customerName}`)
            .then(res => res.json())
            .then(data => {
                if (data.length > 0 && data[0].serviceId) {
                    setServiceId(data[0].serviceId);
                }
            })
            .catch(err => console.error(err));
    }, [serviceName]);

    const handleSubmit = async () => {
        if (!form.name) {
            setSnackbar({ open: true, message: '담당자명을 입력하세요', severity: 'warning' });
            return;
        }

        if (!serviceId) {
            setSnackbar({ open: true, message: 'Service ID를 찾을 수 없습니다', severity: 'error' });
            return;
        }

        try {
            const body = {
                ...form,
                serviceId: serviceId,
            };

            const res = await fetch('http://localhost:8080/api/service-manager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                setSnackbar({ open: true, message: '등록 실패: ' + text, severity: 'error' });
                return;
            }

            navigate('/dashboard/workhistory');
        } catch (err) {
            console.error('등록 실패:', err);
            setSnackbar({ open: true, message: '등록 중 오류 발생', severity: 'error' });
        }
    };

    return (
        <Box sx={{ width: '100%', ml: 0, mt: 3 }}>
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
            <ServiceManagerForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
            />
        </Box>
    );
}
