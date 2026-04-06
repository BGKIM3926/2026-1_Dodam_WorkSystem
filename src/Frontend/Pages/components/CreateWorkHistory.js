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
        systemIds: []
    });

    // ✅ 파일 state 추가
    const [files, setFiles] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });

    const serviceName = selectedNode?.serviceName;
    const customerName = selectedNode?.customerName;
    const [systems, setSystems] = useState([]);

    useEffect(() => {
        if (!serviceName) return;

        fetch(`http://localhost:8080/api/dsystem/filter?serviceName=${serviceName}&customerName=${customerName}`)
            .then(res => res.json())
            .then(data => setSystems(data))
            .catch(err => console.error(err));

    }, [serviceName]);

    useEffect(() => {
        if (!serviceName) {
            setSnackbar({ open: true, message: '잘못된 접근입니다.', severity: 'error' });
            navigate('/dashboard/workhistory');
        }
    }, []);

    const handleSubmit = async () => {
        if (form.workType !== '정기점검' && (!form.systemIds || form.systemIds.length === 0)) {
            setSnackbar({ open: true, message: '시스템을 선택하세요', severity: 'warning' });
            return;
        }

        const raw = localStorage.getItem('loginUser');
        const user = raw ? JSON.parse(raw) : null;

        const systemIds = form.workType === '정기점검' ? [null] : form.systemIds;

        try {
            for (const systemId of systemIds) {
                const body = {
                    ...form,
                    systemId: systemId ? Number(systemId) : null,
                    region: customerName,
                    serviceName: serviceName,
                    workerId: user.id,
                    createdBy: user.id
                };
                delete body.systemIds;

                const formData = new FormData();
                formData.append(
                    "data",
                    new Blob([JSON.stringify(body)], { type: "application/json" })
                );
                files.forEach(file => {
                    formData.append("files", file);
                });

                const res = await fetch('http://localhost:8080/api/history/with-files', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    const text = await res.text();
                    setSnackbar({ open: true, message: '등록 실패: ' + text, severity: 'error' });
                    return;
                }
            }

            navigate('/dashboard/workhistory');

        } catch (err) {
            console.error('🔥 업로드 실패:', err);
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
                files={files}        // ✅ 추가
                setFiles={setFiles}  // ✅ 추가
            />
        </Box>
    );
}