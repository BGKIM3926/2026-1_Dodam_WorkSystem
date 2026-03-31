import { Box } from '@mui/material';
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
        equipment: ''
    });

    // ✅ 파일 state 추가
    const [files, setFiles] = useState([]);

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
            alert('잘못된 접근입니다.');
            navigate('/dashboard/workhistory');
        }
    }, []);

    const handleSubmit = async () => {
        if (!form.systemId) {
            alert('시스템을 선택하세요');
            return;
        }

        const raw = localStorage.getItem('loginUser');
        const user = raw ? JSON.parse(raw) : null;

        const body = {
            ...form,
            systemId: Number(form.systemId),
            region: customerName,
            serviceName: serviceName,
            workerId: user.id,
            createdBy: user.id
        };

        try {
            // ✅ FormData 생성
            const formData = new FormData();

            // JSON 데이터 추가
            formData.append(
                "data",
                new Blob([JSON.stringify(body)], { type: "application/json" })
            );

            // 파일 추가
            files.forEach(file => {
                formData.append("files", file);
            });

            // ✅ multipart 요청
            const res = await fetch('http://localhost:8080/api/history/with-files', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const text = await res.text();
                alert('등록 실패: ' + text);
                return;
            }

            navigate('/dashboard/workhistory');

        } catch (err) {
            console.error('🔥 업로드 실패:', err);
            alert('파일 업로드 중 오류 발생');
        }
    };

    return (
        <Box sx={{ width: '100%', ml: 0, mt: 3 }}>
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