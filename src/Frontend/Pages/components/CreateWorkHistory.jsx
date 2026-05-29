import { Alert, Box, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';
import WorkHistoryForm from './WorkHistoryForm';

const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function CreateWorkHistory() {
    const REGULAR_CHECK = '정기점검';
    const FAULT_RESPONSE = '장애조치';
    const TECH_SUPPORT = '기술지원';
    const CONSTRUCTION = '구축';

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { selectedNode } = useSelectedNode();

    const [form, setForm] = useState({
        workType: '',
        issue: '',
        systemIds: [],
        visitDate: getTodayString(),
    });

    const [files, setFiles] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });

    const serviceNameFromQuery = searchParams.get('serviceName');
    const customerNameFromQuery = searchParams.get('customerName');
    const serviceName = selectedNode?.serviceName ?? serviceNameFromQuery;
    const customerName = selectedNode?.customerName ?? customerNameFromQuery;
    const [systems, setSystems] = useState([]);
    const [serviceId, setServiceId] = useState(null);
    const [isLegacyService, setIsLegacyService] = useState(false);

    useEffect(() => {
        if (selectedNode?.serviceId) {
            setServiceId(selectedNode.serviceId);
        }

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
    }, [serviceName, customerName, selectedNode?.serviceId]);

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
        const normalizedWorkType = (form.workType || '').trim();
        const isRegularCheck = normalizedWorkType === REGULAR_CHECK;
        const isFaultOrSupport = normalizedWorkType === FAULT_RESPONSE || normalizedWorkType === TECH_SUPPORT;
        const isConstruction = normalizedWorkType === CONSTRUCTION;
        const normalizedIssue = (form.issue || '').trim();
        const normalizedIssueDetail = (form.issueDetail || '').trim();

        if (isLegacyService) {
            setSnackbar({ open: true, message: '작업 종료 서비스는 이력 등록이 불가합니다.', severity: 'warning' });
            return;
        }

        if (!normalizedWorkType) {
            setSnackbar({ open: true, message: '작업 유형을 선택해 주세요.', severity: 'warning' });
            return;
        }

        if (!isRegularCheck && !serviceId) {
            setSnackbar({ open: true, message: 'Service ID를 찾을 수 없습니다.', severity: 'error' });
            return;
        }

        if (!isRegularCheck && (!form.systemIds || form.systemIds.length === 0)) {
            setSnackbar({ open: true, message: '시스템을 선택해 주세요.', severity: 'warning' });
            return;
        }

        if (!form.visitDate) {
            setSnackbar({ open: true, message: '방문일을 선택해 주세요.', severity: 'warning' });
            return;
        }

        if (form.visitDate > getTodayString()) {
            setSnackbar({ open: true, message: '현재 이후의 날짜는 선택할 수 없습니다', severity: 'warning' });
            return;
        }

        if (isFaultOrSupport || isConstruction) {
            if (!normalizedIssue) {
                setSnackbar({ open: true, message: '내용을 입력해 주세요.', severity: 'warning' });
                return;
            }

            if (!normalizedIssueDetail) {
                setSnackbar({ open: true, message: '내용 상세를 입력해 주세요.', severity: 'warning' });
                return;
            }
        }

        if (isConstruction && (!form.constructionStartDate || !form.constructionEndDate)) {
            setSnackbar({ open: true, message: '구축기간(시작일/종료일)을 모두 선택해 주세요.', severity: 'warning' });
            return;
        }

        const raw = localStorage.getItem('loginUser');
        const user = raw ? JSON.parse(raw) : null;
        if (!user?.id) {
            setSnackbar({ open: true, message: '로그인 정보가 없어 등록할 수 없습니다. 다시 로그인해 주세요.', severity: 'error' });
            return;
        }

        const systemIds = isRegularCheck ? [null] : form.systemIds;
        const uploadFiles = files.filter((file) => file instanceof File && !Number.isNaN(file.size));

        try {
            for (const systemIdItem of systemIds) {
                const body = {
                    ...form,
                    workType: normalizedWorkType,
                    issue: normalizedIssue,
                    issueDetail: normalizedIssueDetail || null,
                    systemId: systemIdItem ? Number(systemIdItem) : null,
                    serviceId: serviceId ? Number(serviceId) : null,
                    region: customerName,
                    serviceName,
                    workerId: user.id,
                    createdBy: user.id,
                };
                delete body.systemIds;

                const formData = new FormData();
                formData.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }), 'data.json');
                uploadFiles.forEach((file) => {
                    formData.append('files', file, file.name);
                });
                formData.append('expectedFileCount', String(uploadFiles.length));

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
            console.error('등록 중 오류:', err);
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
                onFutureVisitDate={() => setSnackbar({ open: true, message: '현재 이후의 날짜는 선택할 수 없습니다', severity: 'warning' })}
            />
        </Box>
    );
}
