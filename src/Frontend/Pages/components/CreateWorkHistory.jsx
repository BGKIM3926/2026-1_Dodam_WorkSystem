import { Alert, Box, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';
import WorkHistoryForm from './WorkHistoryForm';

export default function CreateWorkHistory() {
    const navigate = useNavigate();
    const { selectedNode } = useSelectedNode();

    const [form, setForm] = useState({
        workType: '',
        issue: '',
        systemIds: [],
    });

    const [files, setFiles] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });

    const serviceName = selectedNode?.serviceName;
    const customerName = selectedNode?.customerName;
    const [systems, setSystems] = useState([]);
    const [serviceId, setServiceId] = useState(null);
    const [isLegacyService, setIsLegacyService] = useState(false);

    useEffect(() => {
        if (!serviceName) return;

        fetch(`/api/dsystem/filter?serviceName=${serviceName}&customerName=${customerName}`)
            .then((res) => res.json())
            .then((data) => {
                setSystems(data);
                if (data.length > 0 && data[0].serviceId) {
                    setServiceId(data[0].serviceId);
                }
            })
            .catch((err) => console.error(err));
    }, [serviceName, customerName]);

    useEffect(() => {
        if (!serviceName) {
            setSnackbar({ open: true, message: '잘못된 접근입니다.', severity: 'error' });
            navigate('/dashboard/workhistory');
        }
    }, [serviceName, navigate]);

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
                    setSnackbar({ open: true, message: '작업 종료 서비스는 이력 등록이 불가합니다.', severity: 'warning' });
                    navigate('/dashboard/workhistory');
                }
            })
            .catch((err) => console.error(err));
    }, [serviceId, navigate]);

    const handleSubmit = async () => {
        if (isLegacyService) {
            setSnackbar({ open: true, message: '작업 종료 서비스는 이력 등록이 불가합니다.', severity: 'warning' });
            return;
        }

        if (form.workType !== '정기점검' && (!form.systemIds || form.systemIds.length === 0)) {
            setSnackbar({ open: true, message: '시스템을 선택해 주세요.', severity: 'warning' });
            return;
        }

        const raw = localStorage.getItem('loginUser');
        const user = raw ? JSON.parse(raw) : null;

        const systemIds = form.workType === '정기점검' ? [null] : form.systemIds;

        try {
            for (const systemIdItem of systemIds) {
                const body = {
                    ...form,
                    systemId: systemIdItem ? Number(systemIdItem) : null,
                    serviceId: serviceId ? Number(serviceId) : null,
                    region: customerName,
                    serviceName,
                    workerId: user.id,
                    createdBy: user.id,
                };
                delete body.systemIds;

                const formData = new FormData();
                formData.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
                files.forEach((file) => {
                    formData.append('files', file);
                });

                const res = await fetch('/api/history/with-files', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const text = await res.text();
                    setSnackbar({ open: true, message: `등록 실패: ${text}`, severity: 'error' });
                    return;
                }
            }

            navigate('/dashboard/workhistory');
        } catch (err) {
            console.error('업로드 실패:', err);
            setSnackbar({ open: true, message: '파일 업로드 중 오류 발생', severity: 'error' });
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
            <WorkHistoryForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                systems={systems}
                files={files}
                setFiles={setFiles}
            />
        </Box>
    );
}
