import {
    Grid,
    Card,
    CardContent,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useState } from 'react';

export default function HistoryList({ rows, isGlobalView }) {

    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [form, setForm] = useState({});

    const handleUpdate = async () => {
        await fetch(`http://localhost:8080/api/history/${selectedRow.historyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        setOpenEdit(false);
        window.location.reload();
    };

    const handleDelete = async () => {
        await fetch(`http://localhost:8080/api/history/${selectedRow.historyId}`, {
            method: 'DELETE'
        });

        setOpenDelete(false);
        window.location.reload();
    };

    return (
        <Grid container spacing={4} columns={16}>
            {rows.map((row) => (
                <Grid size={8} key={row.historyId}>
                    <Card sx={{ position: 'relative', height: '100%' }}>
                        <CardContent>
                            {!isGlobalView && (
                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                    <IconButton onClick={() => {
                                        setSelectedRow(row);
                                        setForm(row);
                                        setOpenEdit(true);
                                    }}>
                                        <EditIcon />
                                    </IconButton>

                                    <IconButton onClick={() => {
                                        setSelectedRow(row);
                                        setOpenDelete(true);
                                    }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            )}

                            <Typography variant="subtitle1" fontWeight={600}>
                                {row.workType}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                {row.issue}
                            </Typography>

                            <Typography variant="caption">
                                👤 {row.workerName}
                            </Typography>

                            <Typography variant="caption" sx={{ ml: 2 }}>
                                🖥 {row.region} / {row.systemName}
                            </Typography>

                            <Typography variant="caption" sx={{ ml: 2 }}>
                                📅 {row.visitDate}
                            </Typography>

                        </CardContent>
                    </Card>
                </Grid>
            ))}

            <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
                <DialogTitle>이력 수정</DialogTitle>

                <DialogContent>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>작업 유형</InputLabel>
                        <Select
                            value={form.workType || ''}
                            label="작업 유형"
                            onChange={(e) =>
                                setForm({ ...form, workType: e.target.value })
                            }
                        >
                            <MenuItem value="정기점검">정기점검</MenuItem>
                            <MenuItem value="장애조치">장애조치</MenuItem>
                            <MenuItem value="기술지원">기술지원</MenuItem>
                            <MenuItem value="구축">구축</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        margin="dense"
                        label="내용"
                        value={form.issue || ''}
                        onChange={(e) => setForm({ ...form, issue: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        margin="dense"
                        label="장비"
                        value={form.equipment || ''}
                        onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>취소</Button>
                    <Button variant="contained" onClick={handleUpdate}>
                        수정
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
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