import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    TextField,
    Typography
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import { useState } from 'react';

export default function UsersList({ rows, fetchUsers }) {
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [form, setForm] = useState({});

    // 🔥 수정
    const handleUpdate = async () => {
        console.log('🔥 update form:', form);

        await fetch(`/api/users/${selectedRow.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedRow.id,
                name: form.name,
                role: form.role,
                password: form.password
            })
        });

        setOpenEdit(false);
        fetchUsers();
    };

    // 🔥 삭제
    const handleDelete = async () => {
        await fetch(`/api/users/${selectedRow.id}`, {
            method: 'DELETE'
        });

        setOpenDelete(false);
        fetchUsers();
    };

    return (
        <Grid container spacing={{ xs: 2, md: 4 }} columns={16} sx={{ justifyContent: 'flex-start' }}>
            {rows.map((row) => (
                <Grid size={{ xs: 16, sm: 16, md: 8 }} key={row.id}>
                    <Card sx={{ position: 'relative', height: '100%' }}>
                        <CardContent sx={{ pr: 10 }}>

                            {/* 🔥 우측 버튼 */}
                            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                                <IconButton onClick={() => {
                                    setSelectedRow(row);
                                    setForm({ ...row, password: '' });
                                    setOpenEdit(true);
                                }} size="small">
                                    <EditIcon />
                                </IconButton>

                                <IconButton onClick={() => {
                                    setSelectedRow(row);
                                    setOpenDelete(true);
                                }} size="small">
                                    <DeleteIcon />
                                </IconButton>
                            </Box>

                            {/* 🔥 카드 내용 */}
                            <Typography variant="h6">{row.name}</Typography>

                            <Typography variant="body2" color="text.secondary">
                                ID: {row.id}
                            </Typography>

                            <Typography variant="body2">
                                Role: {row.role}
                            </Typography>

                        </CardContent>
                    </Card>
                </Grid>
            ))}

            {/* 🔥 수정 Dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="xs">
                <DialogTitle>사용자 수정</DialogTitle>

                <DialogContent>
                    <TextField
                        fullWidth
                        margin="dense"
                        label="이름"
                        value={form.name || ''}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        margin="dense"
                        label="비밀번호"
                        type="password"
                        value={form.password || ''}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        helperText="비워두면 변경되지 않음"
                    />

                    <TextField
                        select
                        fullWidth
                        margin="dense"
                        label="권한"
                        value={form.role || ''}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <MenuItem value="관리자">관리자</MenuItem>
                        <MenuItem value="팀장">팀장</MenuItem>
                        <MenuItem value="일반사용자">일반사용자</MenuItem>
                    </TextField>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>취소</Button>
                    <Button variant="contained" onClick={handleUpdate}>
                        수정
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 🔥 삭제 Dialog */}
            <Dialog open={openDelete} onClose={() => setOpenDelete(false)} fullWidth maxWidth="xs">
                <DialogTitle>삭제 확인</DialogTitle>

                <DialogContent>
                    정말 삭제하시겠습니까?
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenDelete(false)}>취소</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}
