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
    const params = new URLSearchParams(location.search);

    const systemId = params.get('systemId');
    const region = params.get('region');
    const systemName = params.get('systemName');

    useEffect(() => {
        if (!systemId) {
            alert('잘못된 접근입니다.');
            navigate('/dashboard/workhistory');
        }
    }, []);

    const handleSubmit = async () => {
        const raw = localStorage.getItem('loginUser');
        const user = raw ? JSON.parse(raw) : null;

        const body = {
            ...form,
            systemId: Number(systemId),
            region,
            workerId: user?.id || '',
            createdBy: user?.id || ''
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
            />
        </Box>
    );
}