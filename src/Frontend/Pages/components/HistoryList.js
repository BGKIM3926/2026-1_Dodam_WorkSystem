import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    TextField,
    Typography
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import { useEffect, useState } from 'react';

export default function HistoryList({ rows, isGlobalView, onRefresh }) {

    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [form, setForm] = useState({});
    const [openDetail, setOpenDetail] = useState(false);
    const [page, setPage] = useState(1);

    const itemsPerPage = 8;
    const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
    const pagedRows = rows.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    useEffect(() => {
        setPage(1);
    }, [rows]);

    const handleUpdate = async () => {
        await fetch(`http://localhost:8080/api/history/${selectedRow.historyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        setOpenEdit(false);
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleDelete = async () => {
        await fetch(`http://localhost:8080/api/history/${selectedRow.historyId}`, {
            method: 'DELETE'
        });

        setOpenDelete(false);
        if (onRefresh) {
            onRefresh();
        }
    };

    return (
        <Grid container spacing={4} columns={16} sx={{ justifyContent: 'flex-start' }}>
            {pagedRows.map((row) => (
                <Grid size={{ xs: 16, sm: 16, md: 8 }} key={row.historyId}>
                    <Card sx={{
                        position: 'relative',
                        height: '100%',
                        cursor: 'pointer',
                        transition: '0.2s',
                        '&:hover': {
                            boxShadow: 6,
                            transform: 'translateY(-4px)'
                        }
                        }} 
                        onClick={() => {
                        setSelectedRow(row);
                        setOpenDetail(true);
                    }}>
                        <CardContent>
                            {!isGlobalView && (
                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                    <IconButton onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRow(row);
                                        setForm(row);
                                        setOpenEdit(true);
                                    }}>
                                        <EditIcon />
                                    </IconButton>

                                    <IconButton onClick={(e) => {
                                        e.stopPropagation();
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

            {rows.length > itemsPerPage && (
                <Grid size={16}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, value) => setPage(value)}
                            color="primary"
                        />
                    </Box>
                </Grid>
            )}

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
            
            <Dialog
                open={openDetail}
                onClose={() => setOpenDetail(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>이력 상세</DialogTitle>

                <DialogContent dividers>
                    {selectedRow && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography><b>지역:</b> {selectedRow.region}</Typography>
                            <Typography><b>서비스명:</b> {selectedRow.serviceName || '-'}</Typography>
                            <Typography><b>시스템:</b> {selectedRow.systemName}</Typography>
                            <Typography><b>작업 유형:</b> {selectedRow.workType}</Typography>
                            <Typography><b>내용:</b> {selectedRow.issue}</Typography>
                            <Typography><b>장비:</b> {selectedRow.equipment}</Typography>
                            <Typography><b>작업자:</b> {selectedRow.workerName}</Typography>
                            <Typography><b>방문일:</b> {selectedRow.visitDate}</Typography>

                            <Typography><b>첨부파일:</b></Typography>

                            {selectedRow.attachments && selectedRow.attachments.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {selectedRow.attachments.map((file) => (
                                        <Button
                                            key={file.attachmentId}
                                            variant="outlined"
                                            sx={{ justifyContent: 'flex-start' }}
                                            onClick={() => {
                                                window.open(
                                                    `http://localhost:8080/api/history/attachments/${file.attachmentId}/download`
                                                );
                                            }}
                                        >
                                            📎 {file.fileName}
                                        </Button>
                                    ))}
                                </Box>
                            ) : (
                                <Typography color="text.secondary">첨부파일 없음</Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenDetail(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}