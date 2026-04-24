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
    const [isLegacyService, setIsLegacyService] = useState(false);

    useEffect(() => {
        if (!serviceName) {
            setSnackbar({ open: true, message: '잘못된 접근입니다.', severity: 'error' });
            navigate('/dashboard/workhistory');
            return;
        }

        fetch(`/api/dsystem/filter?serviceName=${serviceName}&customerName=${customerName}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.length > 0 && data[0].serviceId) {
                    setServiceId(data[0].serviceId);
                }
            })
            .catch((err) => console.error(err));
    }, [serviceName, customerName, navigate]);

    useEffect(() => {
        if (!serviceId) {
            setIsLegacyService(false);
            return;
        }

        fetch(`/api/legacy-service/check?serviceId=${serviceId}`)
            .then((res) => res.json())
            .then((data) => {
                const legacy = !!data.legacy;
                setIsLegacyService(legacy);
                if (legacy) {
                    setSnackbar({ open: true, message: '작업 종료 서비스는 정보 등록이 불가합니다.', severity: 'warning' });
                    navigate('/dashboard/workhistory');
                }
            })
            .catch((err) => console.error(err));
    }, [serviceId, navigate]);

    const handleSubmit = async () => {
        if (isLegacyService) {
            setSnackbar({ open: true, message: '작업 종료 서비스는 정보 등록이 불가합니다.', severity: 'warning' });
            return;
        }

        if (!form.name?.trim()) {
            setSnackbar({ open: true, message: '담당자명을 입력해 주세요.', severity: 'warning' });
            return;
        }

        if (!serviceId) {
            setSnackbar({ open: true, message: 'Service ID를 찾을 수 없습니다.', severity: 'error' });
            return;
        }

        try {
            const body = {
                ...form,
                serviceId,
            };

            const res = await fetch('/api/service-manager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                setSnackbar({ open: true, message: `등록 실패: ${text}`, severity: 'error' });
                return;
            }

            navigate('/dashboard/workhistory');
        } catch (err) {
            console.error('등록 중 오류:', err);
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
