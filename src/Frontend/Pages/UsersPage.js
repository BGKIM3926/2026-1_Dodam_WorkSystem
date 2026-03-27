import { Container, Box } from '@mui/material';
import { useEffect, useState } from 'react';

import UsersList from './components/UserList';
import UsersActions from './components/UserActions';
import UserHeader from './components/UserHeader';

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
        const res = await fetch('http://localhost:8080/api/users');
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
        await fetch('http://localhost:8080/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        setOpenCreate(false);
        fetchUsers();
    };

    return (
        <Container
            maxWidth="lg"
            component="main"
            sx={{ display: 'flex', flexDirection: 'column', my: 16, gap: 2 }}>
            <UserHeader />
            <Box sx={{ mb: 2 }}>
                <UsersActions onAdd={() => setOpenCreate(true)} />
            </Box>

            <UsersList rows={rows} fetchUsers={fetchUsers} />
        </Container>
    );
}