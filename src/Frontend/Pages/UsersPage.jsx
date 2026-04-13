import { Box, Container } from '@mui/material';
import { useEffect, useState } from 'react';

import UsersActions from './components/UserActions';
import UserHeader from './components/UserHeader';
import UsersList from './components/UserList';

export default function UsersPage() {
    const [rows, setRows] = useState([]);
    const [openCreate, setOpenCreate] = useState(false);
    const [form, setForm] = useState({
        id: '',
        password: '',
        name: '',
        role: 'USER'
    });

    // 🔥 조회
    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        const data = await res.json();

        setRows(data.map((u) => ({
            id: u.id,
            ...u
        })));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // 🔥 추가
    const handleCreate = async () => {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        setOpenCreate(false);
        fetchUsers();
    };

    return (
        <Container
            maxWidth={false}
            component="main"
            sx={{ display: 'flex', flexDirection: 'column', my: { xs: 10, md: 16 }, gap: 2, alignItems: 'stretch', px: { xs: 2, sm: 3, md: 4 } }}>
            <UserHeader rows={rows} />
            <Box sx={{ mb: 2 }}>
                <UsersActions onAdd={() => setOpenCreate(true)} />
            </Box>

            <UsersList rows={rows} fetchUsers={fetchUsers} />
        </Container>
    );
}
