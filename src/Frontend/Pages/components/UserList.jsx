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
        await fetch(`/api/users/${selectedRow.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedRow.id,
                name: form.name,
                email: form.email,
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

    const fieldLabelSx = {
        fontSize: '13px',
        fontWeight: 600,
        mb: 0.75,
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

                            {row.email && (
                                <Typography variant="body2" color="text.secondary">
                                    Email: {row.email}
                                </Typography>
                            )}

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

                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                        <Typography sx={fieldLabelSx}>이름</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={form.name || ''}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </Box>

                    <Box>
                        <Typography sx={fieldLabelSx}>이메일</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="email"
                            value={form.email || ''}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </Box>

                    <Box>
                        <Typography sx={fieldLabelSx}>비밀번호</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="password"
                            autoComplete="new-password"
                            placeholder="비워두면 변경되지 않음"
                            value={form.password || ''}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </Box>

                    <Box>
                        <Typography sx={fieldLabelSx}>권한</Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={form.role || ''}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <MenuItem value="관리자">관리자</MenuItem>
                            <MenuItem value="팀장">팀장</MenuItem>
                            <MenuItem value="일반사용자">일반사용자</MenuItem>
                        </TextField>
                    </Box>
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
