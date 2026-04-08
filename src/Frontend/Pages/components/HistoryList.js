import {
    Box,
    Button,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { DataGrid } from '@mui/x-data-grid';
import { koKR } from '@mui/x-data-grid/locales';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { useEffect, useState } from 'react';

function SubHistoryPanel({ historyId, expanded }) {
    const [subRows, setSubRows] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [subForm, setSubForm] = useState({ content: '', contentDetail: '' });
    const [files, setFiles] = useState([]);
    const [editingSubId, setEditingSubId] = useState(null);
    const [editForm, setEditForm] = useState({ content: '', contentDetail: '' });
    const [openDeleteSub, setOpenDeleteSub] = useState(false);
    const [deleteSubId, setDeleteSubId] = useState(null);
    const [openSubDetail, setOpenSubDetail] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);

    const fetchSubRows = async () => {
        const res = await fetch(`http://localhost:8080/api/history-sub/${historyId}`);
        const data = await res.json();
        setSubRows(data);
    };

    useEffect(() => {
        if (expanded) {
            fetchSubRows();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expanded, historyId]);

    const handleAddSub = async () => {
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify({ historyId, content: subForm.content, contentDetail: subForm.contentDetail })], { type: 'application/json' }));
        files.forEach((file) => formData.append('files', file));

        await fetch('http://localhost:8080/api/history-sub/with-files', {
            method: 'POST',
            body: formData,
        });

        setSubForm({ content: '', contentDetail: '' });
        setFiles([]);
        setShowAddForm(false);
        fetchSubRows();
    };

    const handleUpdateSub = async (subId) => {
        await fetch(`http://localhost:8080/api/history-sub/${subId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        setEditingSubId(null);
        fetchSubRows();
    };

    const handleDeleteSub = async () => {
        await fetch(`http://localhost:8080/api/history-sub/${deleteSubId}`, { method: 'DELETE' });
        setOpenDeleteSub(false);
        setDeleteSubId(null);
        fetchSubRows();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prev) => [...prev, ...droppedFiles]);
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selected]);
    };

    return (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 4, pr: 2, py: 2, backgroundColor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
                {subRows.length === 0 && !showAddForm && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        등록된 진행사항이 없습니다.
                    </Typography>
                )}

                {subRows.map((sub, index) => (
                    <Box key={sub.subId} sx={{ mb: 1.5, p: 1.5, backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        {editingSubId === sub.subId ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <TextField
                                    size="small"
                                    label="내용"
                                    fullWidth
                                    value={editForm.content}
                                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                />
                                <TextField
                                    size="small"
                                    label="내용 상세"
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    value={editForm.contentDetail}
                                    onChange={(e) => setEditForm({ ...editForm, contentDetail: e.target.value })}
                                    sx={{ '& .MuiOutlinedInput-root': { height: 'auto' } }}
                                />
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <Button size="small" onClick={() => setEditingSubId(null)}>취소</Button>
                                    <Button size="small" variant="contained" onClick={() => handleUpdateSub(sub.subId)}>저장</Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box
                                    sx={{ flex: 1, cursor: 'pointer' }}
                                    onClick={() => { setSelectedSub(sub); setOpenSubDetail(true); }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {index + 1}. {sub.content}
                                        </Typography>
                                        {sub.attachments && sub.attachments.length > 0 && (
                                            <Typography variant="caption" color="primary">📎 {sub.attachments.length}</Typography>
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {sub.createdAt ? dayjs(sub.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" sx={{ border: 'none' }} onClick={() => {
                                        setEditingSubId(sub.subId);
                                        setEditForm({ content: sub.content, contentDetail: sub.contentDetail || '' });
                                    }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" sx={{ border: 'none' }} onClick={() => {
                                        setDeleteSubId(sub.subId);
                                        setOpenDeleteSub(true);
                                    }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ))}

                {showAddForm ? (
                    <Box sx={{ mt: 1, p: 2, backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>진행사항 추가</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField
                                size="small"
                                label="내용"
                                fullWidth
                                value={subForm.content}
                                onChange={(e) => setSubForm({ ...subForm, content: e.target.value })}
                            />
                            <TextField
                                size="small"
                                label="내용 상세"
                                fullWidth
                                multiline
                                minRows={3}
                                value={subForm.contentDetail}
                                onChange={(e) => setSubForm({ ...subForm, contentDetail: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { height: 'auto' } }}
                            />
                            <Paper
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                sx={{ p: 2, textAlign: 'center', border: '2px dashed #ccc', cursor: 'pointer' }}
                            >
                                <CloudUploadIcon fontSize="small" />
                                <Typography variant="body2">파일을 드래그하거나 클릭해서 업로드</Typography>
                                <Button component="label" variant="outlined" size="small" sx={{ mt: 1 }}>
                                    파일 선택
                                    <input hidden multiple type="file" onChange={handleFileChange} />
                                </Button>
                            </Paper>
                            {files.map((file, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ flex: 1 }}>📎 {file.name}</Typography>
                                    <IconButton size="small" color="error" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button size="small" onClick={() => { setShowAddForm(false); setSubForm({ content: '', contentDetail: '' }); setFiles([]); }}>취소</Button>
                                <Button size="small" variant="contained" onClick={handleAddSub} disabled={!subForm.content}>등록</Button>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddForm(true)}
                        sx={{ mt: 1 }}
                    >
                        진행사항 추가
                    </Button>
                )}

                {/* 진행사항 삭제 확인 Dialog */}
                <Dialog open={openDeleteSub} onClose={() => setOpenDeleteSub(false)}>
                    <DialogTitle>삭제 확인</DialogTitle>
                    <DialogContent>진행사항을 삭제하시겠습니까?</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDeleteSub(false)}>취소</Button>
                        <Button color="error" variant="contained" onClick={handleDeleteSub}>삭제</Button>
                    </DialogActions>
                </Dialog>

                {/* 진행사항 상세 Dialog */}
                <Dialog open={openSubDetail} onClose={() => setOpenSubDetail(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>진행사항 상세</DialogTitle>
                    <DialogContent dividers>
                        {selectedSub && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography><b>내용:</b> {selectedSub.content}</Typography>
                                {selectedSub.contentDetail && (
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}><b>내용 상세:</b> {selectedSub.contentDetail}</Typography>
                                )}
                                <Typography><b>등록일:</b> {selectedSub.createdAt ? dayjs(selectedSub.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</Typography>
                                <Typography><b>첨부파일:</b></Typography>
                                {selectedSub.attachments && selectedSub.attachments.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {selectedSub.attachments.map((file) => {
                                            const ext = file.fileName?.split('.').pop()?.toLowerCase();
                                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
                                            const fileUrl = `http://localhost:8080/api/history/attachments/${file.attachmentId}/download`;
                                            return (
                                                <Box key={file.attachmentId} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {isImage && (
                                                        <Box
                                                            component="img"
                                                            src={fileUrl}
                                                            alt={file.fileName}
                                                            sx={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }}
                                                        />
                                                    )}
                                                    <Button variant="outlined" sx={{ justifyContent: 'flex-start' }} onClick={() => window.open(fileUrl)}>
                                                        📎 {file.fileName}
                                                    </Button>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary">첨부파일 없음</Typography>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenSubDetail(false)}>닫기</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Collapse>
    );
}

export default function HistoryList({ rows, isGlobalView, onRefresh, filter }) {

    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [form, setForm] = useState({});
    const [openDetail, setOpenDetail] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    const toggleExpand = (rowId) => {
        setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const isInspectionView = !isGlobalView && filter === '정기점검';
    const isSupportOrFaultView = !isGlobalView && (filter === '기술지원' || filter === '장애조치');
    const isConstructionView = !isGlobalView && filter === '구축';
    const isManagerView = !isGlobalView && filter === '기관정보';

    const expandColumn = {
        field: 'expand',
        headerName: '',
        width: 50,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderHeader: () => null,
        renderCell: (params) => (
            <IconButton
                size="small"
                sx={{ border: 'none' }}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(params.row.historyId);
                }}
            >
                {expandedRows[params.row.historyId] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
        )
    };

    const actionColumn = {
        field: 'actions',
        headerName: '',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
                <IconButton size="small" sx={{ border: 'none' }} onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRow(params.row);
                    setForm(params.row);
                    setOpenEdit(true);
                }}>
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" sx={{ border: 'none' }} onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRow(params.row);
                    setOpenDelete(true);
                }}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
        )
    };

    const defaultColumns = [
        ...(!isGlobalView ? [expandColumn] : []),
        { field: 'region', headerName: '사이트명', flex: 1, sortable: false },
        { field: 'serviceName', headerName: '서비스명', flex: 1, sortable: false },
        { field: 'systemName', headerName: '시스템', flex: 1, sortable: false },
        { field: 'issue', headerName: '내용', flex: 1.5, sortable: false },
        { field: 'visitDate', headerName: '방문일', flex: 0.8, sortable: false },
        ...(!isGlobalView ? [actionColumn] : [])
    ];

    const inspectionColumns = [
        {
            field: 'inspectionMonth',
            headerName: '점검 월',
            flex: 1,
            sortable: false,
            valueGetter: (value, row) => row.visitDate ? row.visitDate.substring(0, 7) : ''
        },
        { field: 'visitDate', headerName: '방문일', flex: 1, sortable: false },
        {
            field: 'attachmentStatus',
            headerName: '첨부파일',
            flex: 1,
            sortable: false,
            valueGetter: (value, row) => row.attachments && row.attachments.length > 0 ? '첨부' : '미첨부'
        },
        actionColumn
    ];

    const supportFaultColumns = [
        expandColumn,
        { field: 'systemName', headerName: '시스템', flex: 1, sortable: false },
        { field: 'issue', headerName: '내용', flex: 1.5, sortable: false },
        { field: 'workerName', headerName: '작업자', flex: 0.8, sortable: false },
        { field: 'visitDate', headerName: '방문일', flex: 0.8, sortable: false },
        { field: 'completedDate', headerName: '완료일', flex: 0.8, sortable: false, valueGetter: (value, row) => row.completedDate || '-' },
        actionColumn
    ];

    const constructionColumns = [
        expandColumn,
        { field: 'systemName', headerName: '시스템', flex: 1, sortable: false },
        { field: 'issue', headerName: '내용', flex: 1.5, sortable: false },
        { field: 'workerName', headerName: '작업자', flex: 0.8, sortable: false },
        { field: 'visitDate', headerName: '방문일', flex: 0.8, sortable: false },
        {
            field: 'constructionPeriod',
            headerName: '구축기간',
            flex: 1.2,
            sortable: false,
            valueGetter: (value, row) => {
                if (row.constructionStartDate && row.constructionEndDate) {
                    return `${row.constructionStartDate} ~ ${row.constructionEndDate}`;
                }
                return '-';
            }
        },
        actionColumn
    ];

    const managerColumns = [
        { field: 'name', headerName: '담당자명', flex: 1, sortable: false },
        { field: 'dept', headerName: '부서명', flex: 1, sortable: false },
        { field: 'phone', headerName: '전화번호', flex: 1, sortable: false },
        { field: 'email', headerName: '이메일', flex: 1.2, sortable: false },
        {
            field: 'updateDate',
            headerName: '갱신일',
            flex: 1,
            sortable: false,
            valueGetter: (value, row) => row.updateDate ? row.updateDate.substring(0, 10) : '-'
        },
        actionColumn
    ];

    const columns = isInspectionView
        ? inspectionColumns
        : isSupportOrFaultView
            ? supportFaultColumns
            : isConstructionView
                ? constructionColumns
                : isManagerView
                    ? managerColumns
                    : defaultColumns;

    const handleUpdate = async () => {
        const url = isManagerView
            ? `http://localhost:8080/api/service-manager/${selectedRow.managerId}`
            : `http://localhost:8080/api/history/${selectedRow.historyId}`;

        await fetch(url, {
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
        const url = isManagerView
            ? `http://localhost:8080/api/service-manager/${selectedRow.managerId}`
            : `http://localhost:8080/api/history/${selectedRow.historyId}`;

        await fetch(url, { method: 'DELETE' });

        setOpenDelete(false);
        if (onRefresh) {
            onRefresh();
        }
    };

    return (
        <>
            <Box>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(row) => isManagerView ? row.managerId : row.historyId}
                    localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
                    onRowClick={(params) => {
                        setSelectedRow(params.row);
                        setOpenDetail(true);
                    }}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    disableColumnResize
                    disableRowSelectionOnClick
                    disableColumnSorting
                    disableColumnFilter
                    rowHeight={52}
                    getRowClassName={(params) => expandedRows[params.row.historyId] ? 'row-expanded' : ''}
                    sx={{
                        '& .row-expanded': {
                            backgroundColor: 'action.hover',
                        },
                        '& .MuiDataGrid-cell[data-field="expand"]': {
                            borderRight: 'none',
                        },
                        '& .MuiDataGrid-columnHeader[data-field="expand"]': {
                            borderRight: 'none',
                        },
                        '& .MuiDataGrid-columnHeader[data-field="expand"] .MuiDataGrid-columnSeparator': {
                            display: 'none',
                        },
                    }}
                />

                {/* Sub-history panels rendered below DataGrid for expanded rows */}
                {!isManagerView && !isGlobalView && !isInspectionView && rows.map((row) => (
                    <Collapse key={row.historyId} in={!!expandedRows[row.historyId]} timeout={300} unmountOnExit>
                    <Box sx={{ mt: 2, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                        <Box sx={{ px: 2, py: 1, backgroundColor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">
                                📋 {row.issue || '(제목 없음)'} — {row.visitDate}
                            </Typography>
                            <Button size="small" onClick={() => {
                                setSelectedRow(row);
                                setOpenDetail(true);
                            }}>
                                상세보기
                            </Button>
                        </Box>
                        <SubHistoryPanel
                            historyId={row.historyId}
                            expanded={true}
                        />
                    </Box>
                    </Collapse>
                ))}

            <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
                <DialogTitle>{isManagerView ? '담당자 수정' : '이력 수정'}</DialogTitle>

                <DialogContent>
                    {isManagerView ? (
                        <>
                            <TextField
                                fullWidth
                                margin="dense"
                                label="담당자명"
                                value={form.name || ''}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                margin="dense"
                                label="부서명"
                                value={form.dept || ''}
                                onChange={(e) => setForm({ ...form, dept: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                margin="dense"
                                label="전화번호"
                                value={form.phone || ''}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                margin="dense"
                                label="이메일"
                                value={form.email || ''}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </>
                    ) : (
                        <>
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

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                {form.workType !== '구축' && (
                                    <DatePicker
                                        label="완료일"
                                        value={form.completedDate ? dayjs(form.completedDate) : null}
                                        onChange={(newValue) => setForm(prev => ({ ...prev, completedDate: newValue ? newValue.format('YYYY-MM-DD') : null }))}
                                        format="YYYY-MM-DD"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                margin: 'dense'
                                            }
                                        }}
                                    />
                                )}
                                {form.workType === '구축' && (
                                    <>
                                        <DatePicker
                                            label="구축 시작일"
                                            value={form.constructionStartDate ? dayjs(form.constructionStartDate) : null}
                                            onChange={(newValue) => setForm(prev => ({ ...prev, constructionStartDate: newValue ? newValue.format('YYYY-MM-DD') : null }))}
                                            format="YYYY-MM-DD"
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    margin: 'dense'
                                                }
                                            }}
                                        />
                                        <DatePicker
                                            label="구축 종료일"
                                            value={form.constructionEndDate ? dayjs(form.constructionEndDate) : null}
                                            onChange={(newValue) => setForm(prev => ({ ...prev, constructionEndDate: newValue ? newValue.format('YYYY-MM-DD') : null }))}
                                            format="YYYY-MM-DD"
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    margin: 'dense'
                                                }
                                            }}
                                        />
                                    </>
                                )}
                            </LocalizationProvider>
                        </>
                    )}
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
                <DialogTitle>{isManagerView ? '담당자 상세' : '이력 상세'}</DialogTitle>

                <DialogContent dividers>
                    {selectedRow && isManagerView && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography><b>담당자명:</b> {selectedRow.name}</Typography>
                            <Typography><b>부서명:</b> {selectedRow.dept || '-'}</Typography>
                            <Typography><b>전화번호:</b> {selectedRow.phone || '-'}</Typography>
                            <Typography><b>이메일:</b> {selectedRow.email || '-'}</Typography>
                            <Typography><b>갱신일:</b> {selectedRow.updateDate ? selectedRow.updateDate.substring(0, 10) : '-'}</Typography>
                        </Box>
                    )}
                    {selectedRow && !isManagerView && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography><b>사이트명:</b> {selectedRow.region}</Typography>
                            <Typography><b>서비스명:</b> {selectedRow.serviceName || '-'}</Typography>
                            {selectedRow.workType !== '정기점검' && (
                                <Typography><b>시스템:</b> {selectedRow.systemName}</Typography>
                            )}
                            <Typography><b>작업 유형:</b> {selectedRow.workType}</Typography>
                            <Typography><b>작업자:</b> {selectedRow.workerName}</Typography>
                            <Typography><b>방문일:</b> {selectedRow.visitDate}</Typography>
                            {selectedRow.workType !== '구축' && selectedRow.workType !== '정기점검' && (
                                <Typography><b>완료일:</b> {selectedRow.completedDate || '-'}</Typography>
                            )}
                            {selectedRow.workType === '구축' && (
                                <Typography><b>구축기간:</b> {selectedRow.constructionStartDate || '-'} ~ {selectedRow.constructionEndDate || '-'}</Typography>
                            )}
                            <Typography><b>내용:</b> {selectedRow.issue}</Typography>
                            {selectedRow.issueDetail && (
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}><b>내용 상세:</b> {selectedRow.issueDetail}</Typography>
                            )}
                            <Typography><b>첨부파일:</b></Typography>

                            {selectedRow.attachments && selectedRow.attachments.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {selectedRow.attachments.map((file) => {
                                        const ext = file.fileName?.split('.').pop()?.toLowerCase();
                                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
                                        const imageUrl = `http://localhost:8080/api/history/attachments/${file.attachmentId}/download`;

                                        return (
                                            <Box key={file.attachmentId} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {isImage && (
                                                    <Box
                                                        component="img"
                                                        src={imageUrl}
                                                        alt={file.fileName}
                                                        sx={{
                                                            maxWidth: '100%',
                                                            maxHeight: 300,
                                                            objectFit: 'contain',
                                                            borderRadius: 1,
                                                            border: '1px solid #e0e0e0',
                                                        }}
                                                    />
                                                )}
                                                <Button
                                                    variant="outlined"
                                                    sx={{ justifyContent: 'flex-start' }}
                                                    onClick={() => {
                                                        window.open(imageUrl);
                                                    }}
                                                >
                                                    📎 {file.fileName}
                                                </Button>
                                            </Box>
                                        );
                                    })}
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
            </Box>
        </>
    );
}