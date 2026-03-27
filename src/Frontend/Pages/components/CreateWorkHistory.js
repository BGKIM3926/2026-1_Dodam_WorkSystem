import { Box } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';
import WorkHistoryForm from './WorkHistoryForm';
import { Typography } from '@mui/material';

export default function CreateWorkHistory() {
    const navigate = useNavigate();
    const { selectedNode } = useSelectedNode();

    const [form, setForm] = useState({
        workType: '',
        issue: '',
        equipment: ''
    });

    const location = useLocation();
    const systemId = selectedNode?.systemId;
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

        console.log('systemId:', systemId);
        console.log('🔥 body:', JSON.stringify(body));

        const res = await fetch('http://localhost:8080/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const text = await res.text();
            alert('등록 실패: ' + text);
            return;
        }

        navigate('/dashboard/workhistory');
    };

    return (
        <Box sx={{ maxWidth: 700, mx: 'auto', mt: 3}}>
            <WorkHistoryForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                systems={systems}
            />
        </Box>
    );
}