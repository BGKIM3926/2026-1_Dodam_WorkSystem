import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Alert,
    Box,
    Button,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Snackbar,
    TextField,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { koKR } from '@mui/x-data-grid/locales';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const WORK_TYPE = {
    INSPECTION: '정기점검',
    FAULT: '장애조치',
    SUPPORT: '기술지원',
    CONSTRUCTION: '구축',
    MANAGER: '기관정보',
    REPORT: '점검서 관리',
};

const textareaSx = {
    mt: 1,
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        minHeight: '220px',
        height: 'auto',
        alignItems: 'flex-start',
    },
    '& .MuiOutlinedInput-input': {
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    '& .MuiInputBase-inputMultiline': {
        overflow: 'hidden !important',
        resize: 'none',
    },
};

function AutoResizeTextField({ value, onChange, sx, ...props }) {
    const inputRef = useRef(null);

    const resizeTextarea = () => {
        const input = inputRef.current;
        if (!input) {
            return;
        }

        input.style.height = 'auto';
        input.style.height = `${input.scrollHeight}px`;
    };

    useLayoutEffect(() => {
        resizeTextarea();
    }, [value]);

    return (
        <TextField
            {...props}
            multiline
            value={value}
            onChange={(event) => {
                onChange?.(event);
                requestAnimationFrame(resizeTextarea);
            }}
            inputRef={inputRef}
            sx={sx}
        />
    );
}

function buildAttachmentQuery(retainedAttachments) {
    const params = new URLSearchParams();
    retainedAttachments.forEach((file) => {
        params.append('retainedAttachmentIds', file.attachmentId);
    });
    return params.toString();
}

function AttachmentEditor({ retainedAttachments, setRetainedAttachments, editFiles, setEditFiles }) {
    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setEditFiles((prev) => [...prev, ...droppedFiles]);
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        setEditFiles((prev) => [...prev, ...selected]);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>기존 첨부파일</Typography>
            {retainedAttachments.length > 0 ? (
                retainedAttachments.map((file) => (
                    <Box key={file.attachmentId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>📎 {file.fileName}</Typography>
                        <IconButton size="small" color="error" onClick={() => setRetainedAttachments((prev) => prev.filter((item) => item.attachmentId !== file.attachmentId))}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ))
            ) : (
                <Typography variant="body2" color="text.secondary">첨부파일 없음</Typography>
            )}

            <Typography variant="body2" sx={{ fontWeight: 600 }}>새 첨부파일</Typography>
            <Paper onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} sx={{ p: 2, textAlign: 'center', border: '2px dashed #ccc', cursor: 'pointer' }}>
                <CloudUploadIcon fontSize="small" />
                <Typography variant="body2">파일을 드래그하거나 클릭해서 업로드</Typography>
                <Button component="label" variant="outlined" size="small" sx={{ mt: 1 }}>
                    파일 선택
                    <input hidden multiple type="file" onChange={handleFileChange} />
                </Button>
            </Paper>

            {editFiles.map((file, idx) => (
                <Box key={`${file.name}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>📎 {file.name}</Typography>
                    <IconButton size="small" color="error" onClick={() => setEditFiles((prev) => prev.filter((_, i) => i !== idx))}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}
        </Box>
    );
}

function AttachmentPreviewList({ attachments }) {
    if (!attachments?.length) {
        return <Typography color="text.secondary">첨부파일 없음</Typography>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {attachments.map((file) => {
                const ext = file.fileName?.split('.').pop()?.toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
                const fileUrl = `/api/history/attachments/${file.attachmentId}/download`;

                return (
                    <Box key={file.attachmentId} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {isImage && <Box component="img" src={fileUrl} alt={file.fileName} sx={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }} />}
                        <Button variant="outlined" sx={{ justifyContent: 'flex-start' }} onClick={() => window.open(fileUrl)}>
                            📎 {file.fileName}
                        </Button>
                    </Box>
                );
            })}
        </Box>
    );
}
function SubHistoryPanel({ historyId, expanded }) {
    const [subRows, setSubRows] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [subForm, setSubForm] = useState({ content: '', contentDetail: '' });
    const [files, setFiles] = useState([]);
    const [editingSubId, setEditingSubId] = useState(null);
    const [editForm, setEditForm] = useState({ content: '', contentDetail: '' });
    const [editFiles, setEditFiles] = useState([]);
    const [retainedAttachments, setRetainedAttachments] = useState([]);
    const [openDeleteSub, setOpenDeleteSub] = useState(false);
    const [deleteSubId, setDeleteSubId] = useState(null);
    const [openSubDetail, setOpenSubDetail] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);

    const fetchSubRows = async () => {
        const res = await fetch(`/api/history-sub/${historyId}`);
        const data = await res.json();
        setSubRows(data);
    };

    useEffect(() => {
        if (expanded) {
            fetchSubRows();
        }
    }, [expanded, historyId]);

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prev) => [...prev, ...droppedFiles]);
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selected]);
    };

    const resetSubEdit = () => {
        setEditingSubId(null);
        setEditForm({ content: '', contentDetail: '' });
        setEditFiles([]);
        setRetainedAttachments([]);
    };

    const handleAddSub = async () => {
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify({ historyId, content: subForm.content, contentDetail: subForm.contentDetail })], { type: 'application/json' }));
        files.forEach((file) => formData.append('files', file));

        await fetch('/api/history-sub/with-files', {
            method: 'POST',
            body: formData,
        });

        setSubForm({ content: '', contentDetail: '' });
        setFiles([]);
        setShowAddForm(false);
        fetchSubRows();
    };

    const handleStartEdit = (sub) => {
        setEditingSubId(sub.subId);
        setEditForm({ content: sub.content || '', contentDetail: sub.contentDetail || '' });
        setEditFiles([]);
        setRetainedAttachments(sub.attachments || []);
    };

    const handleUpdateSub = async (subId) => {
        try {
            const formData = new FormData();
            formData.append('data', new Blob([JSON.stringify(editForm)], { type: 'application/json' }), 'data.json');
            editFiles.forEach((file) => formData.append('files', file));

            const query = buildAttachmentQuery(retainedAttachments);
            const url = query ? `/api/history-sub/with-files/${subId}?${query}` : `/api/history-sub/with-files/${subId}`;

            const response = await fetch(url, {
                method: 'PUT',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('진행사항 수정에 실패했습니다.');
            }

            resetSubEdit();
            fetchSubRows();
        } catch (error) {
            console.error(error);
            alert(error.message || '진행사항 수정에 실패했습니다.');
        }
    };

    const handleDeleteSub = async () => {
        await fetch(`/api/history-sub/${deleteSubId}`, { method: 'DELETE' });
        setOpenDeleteSub(false);
        setDeleteSubId(null);
        fetchSubRows();
    };

    return (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ pl: { xs: 2, md: 4 }, pr: { xs: 1.5, md: 2 }, py: 2, backgroundColor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
                {subRows.length === 0 && !showAddForm && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>등록된 진행사항이 없습니다.</Typography>}

                {subRows.map((sub, index) => (
                    <Box key={sub.subId} sx={{ mb: 1.5, p: 1.5, backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        {editingSubId === sub.subId ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <TextField size="small" label="내용" fullWidth value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
                                <AutoResizeTextField size="small" label="내용 상세" fullWidth minRows={8} value={editForm.contentDetail} onChange={(e) => setEditForm({ ...editForm, contentDetail: e.target.value })} sx={textareaSx} />
                                <AttachmentEditor retainedAttachments={retainedAttachments} setRetainedAttachments={setRetainedAttachments} editFiles={editFiles} setEditFiles={setEditFiles} />
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <Button size="small" onClick={resetSubEdit}>취소</Button>
                                    <Button size="small" variant="contained" onClick={() => handleUpdateSub(sub.subId)} disabled={!editForm.content}>수정</Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={() => { setSelectedSub(sub); setOpenSubDetail(true); }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{index + 1}. {sub.content}</Typography>
                                        {sub.attachments?.length > 0 && <Typography variant="caption" color="primary">📎 {sub.attachments.length}</Typography>}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">{sub.createdAt ? dayjs(sub.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" sx={{ border: 'none' }} onClick={() => handleStartEdit(sub)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" sx={{ border: 'none' }} onClick={() => { setDeleteSubId(sub.subId); setOpenDeleteSub(true); }}><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ))}

                {showAddForm ? (
                    <Box sx={{ mt: 1, p: 2, backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>진행사항 추가</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField size="small" label="내용" fullWidth value={subForm.content} onChange={(e) => setSubForm({ ...subForm, content: e.target.value })} />
                            <AutoResizeTextField size="small" label="내용 상세" fullWidth minRows={8} value={subForm.contentDetail} onChange={(e) => setSubForm({ ...subForm, contentDetail: e.target.value })} sx={textareaSx} />
                            <Paper onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} sx={{ p: 2, textAlign: 'center', border: '2px dashed #ccc', cursor: 'pointer' }}>
                                <CloudUploadIcon fontSize="small" />
                                <Typography variant="body2">파일을 드래그하거나 클릭해서 업로드</Typography>
                                <Button component="label" variant="outlined" size="small" sx={{ mt: 1 }}>
                                    파일 선택
                                    <input hidden multiple type="file" onChange={handleFileChange} />
                                </Button>
                            </Paper>
                            {files.map((file, idx) => (
                                <Box key={`${file.name}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ flex: 1 }}>📎 {file.name}</Typography>
                                    <IconButton size="small" color="error" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                            ))}
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button size="small" onClick={() => { setShowAddForm(false); setSubForm({ content: '', contentDetail: '' }); setFiles([]); }}>취소</Button>
                                <Button size="small" variant="contained" onClick={handleAddSub} disabled={!subForm.content}>등록</Button>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Button size="small" startIcon={<AddIcon />} onClick={() => setShowAddForm(true)} sx={{ mt: 1 }}>진행사항 추가</Button>
                )}

                <Dialog open={openDeleteSub} onClose={() => setOpenDeleteSub(false)}>
                    <DialogTitle>삭제 확인</DialogTitle>
                    <DialogContent>진행사항을 삭제하시겠습니까?</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDeleteSub(false)}>취소</Button>
                        <Button color="error" variant="contained" onClick={handleDeleteSub}>삭제</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openSubDetail} onClose={() => setOpenSubDetail(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>진행사항 상세</DialogTitle>
                    <DialogContent dividers>
                        {selectedSub && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography><b>내용:</b> {selectedSub.content}</Typography>
                                {selectedSub.contentDetail && (
                                    <Box>
                                        <Typography sx={{ fontWeight: 700 }}>내용 상세</Typography>
                                        <Typography sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{selectedSub.contentDetail}</Typography>
                                    </Box>
                                )}
                                <Typography><b>등록일:</b> {selectedSub.createdAt ? dayjs(selectedSub.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</Typography>
                                <Typography sx={{ fontWeight: 700 }}>첨부파일</Typography>
                                <AttachmentPreviewList attachments={selectedSub.attachments} />
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
export default function HistoryList({ rows, isGlobalView, onRefresh, filter, targetHistoryId }) {
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [form, setForm] = useState({});
    const [openDetail, setOpenDetail] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const [editFiles, setEditFiles] = useState([]);
    const [retainedAttachments, setRetainedAttachments] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });
    const [selectedReportIds, setSelectedReportIds] = useState([]);
    const lastOpenedTargetRef = useRef(null);
    const isMobile = useMediaQuery('(max-width:900px)');
    const today = dayjs().startOf('day');

    const toggleExpand = (rowId) => {
        setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const isInspectionView = !isGlobalView && filter === WORK_TYPE.INSPECTION;
    const isSupportOrFaultView = !isGlobalView && (filter === WORK_TYPE.SUPPORT || filter === WORK_TYPE.FAULT);
    const isConstructionView = !isGlobalView && filter === WORK_TYPE.CONSTRUCTION;
    const isManagerView = !isGlobalView && filter === WORK_TYPE.MANAGER;
    const isReportView = !isGlobalView && filter === WORK_TYPE.REPORT;
    const displayRows = useMemo(() => {
        if (!isManagerView) {
            return rows;
        }

        return [...rows].sort((a, b) => {
            const aDate = a?.updateDate ? new Date(a.updateDate).getTime() : 0;
            const bDate = b?.updateDate ? new Date(b.updateDate).getTime() : 0;
            return bDate - aDate;
        });
    }, [isManagerView, rows]);

    useEffect(() => {
        if (!targetHistoryId || isManagerView || lastOpenedTargetRef.current === targetHistoryId) {
            return;
        }

        const targetRow = displayRows.find((row) => String(row.historyId) === String(targetHistoryId));
        if (!targetRow) {
            return;
        }

        setSelectedRow(targetRow);
        setOpenDetail(true);
        lastOpenedTargetRef.current = targetHistoryId;
    }, [targetHistoryId, displayRows, isManagerView]);

    const handleOpenEdit = (row) => {
        setSelectedRow(row);
        setForm({
            ...row,
            issue: row.issue || '',
            issueDetail: row.issueDetail || '',
            visitDate: row.visitDate || null,
            constructionStartDate: row.constructionStartDate || null,
            constructionEndDate: row.constructionEndDate || null,
        });
        setRetainedAttachments(row.attachments || []);
        setEditFiles([]);
        setOpenEdit(true);
    };

    const normalizeReportSelection = (selection) => {
        if (Array.isArray(selection)) {
            return selection;
        }
        if (selection?.ids) {
            return Array.from(selection.ids);
        }
        return [];
    };

    const handleGenerateReports = async (infoIds) => {
        const ids = Array.isArray(infoIds) ? infoIds : [infoIds];
        const validIds = ids.filter((id) => id !== undefined && id !== null);

        if (validIds.length === 0) {
            setSnackbar({ open: true, message: '점검서를 생성할 데이터를 선택해 주세요.', severity: 'warning' });
            return;
        }

        try {
            const response = await fetch('/api/inspectionreport/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ infoIds: validIds }),
            });

            if (!response.ok) {
                throw new Error('점검서 생성에 실패했습니다.');
            }

            setSnackbar({ open: true, message: '점검서 생성 요청이 완료되었습니다.', severity: 'success' });
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: error.message || '점검서 생성에 실패했습니다.', severity: 'error' });
        }
    };

    const expandColumn = {
        field: 'expand',
        headerName: '',
        width: 50,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderHeader: () => null,
        renderCell: (params) => (
            <IconButton size="small" sx={{ border: 'none' }} onClick={(e) => { e.stopPropagation(); toggleExpand(params.row.historyId); }}>
                {expandedRows[params.row.historyId] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
        ),
    };

    const actionColumn = {
        field: 'actions',
        headerName: '',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
                <IconButton size="small" sx={{ border: 'none' }} onClick={(e) => { e.stopPropagation(); handleOpenEdit(params.row); }}>
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" sx={{ border: 'none' }} onClick={(e) => { e.stopPropagation(); setSelectedRow(params.row); setOpenDelete(true); }}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
        ),
    };

    const reportActionColumn = {
        field: 'actions',
        headerName: '',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
            <Button
                size="small"
                variant="contained"
                onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateReports(params.row.id);
                }}
            >
                생성
            </Button>
        ),
    };

    const defaultColumns = [
        ...(!isGlobalView ? [expandColumn] : []),
        { field: 'region', headerName: '사이트명', flex: 1, sortable: false },
        { field: 'serviceName', headerName: '서비스명', flex: 1, sortable: false },
        { field: 'systemName', headerName: '시스템', flex: 1, sortable: false },
        { field: 'issue', headerName: '내용', flex: 1.5, sortable: false },
        { field: 'visitDate', headerName: '방문일', flex: 0.8, sortable: false },
        ...(!isGlobalView ? [actionColumn] : []),
    ];

    const inspectionColumns = [
        {
            field: 'inspectionMonth',
            headerName: '점검 월',
            flex: 1,
            sortable: false,
            valueGetter: (value, row) => (row.visitDate ? row.visitDate.substring(0, 7) : ''),
        },
        { field: 'visitDate', headerName: '방문일', flex: 1, sortable: false },
        {
            field: 'attachmentStatus',
            headerName: '첨부파일',
            flex: 1,
            sortable: false,
            valueGetter: (value, row) => (row.attachments && row.attachments.length > 0 ? '첨부' : '미첨부'),
        },
        actionColumn,
    ];

    const supportFaultColumns = [
        expandColumn,
        { field: 'systemName', headerName: '시스템', flex: 1, sortable: false },
        { field: 'issue', headerName: '내용', flex: 1.5, sortable: false },
        { field: 'workerName', headerName: '작업자', flex: 0.8, sortable: false },
        { field: 'visitDate', headerName: '방문일', flex: 0.8, sortable: false },
        { field: 'completedDate', headerName: '완료일', flex: 0.8, sortable: false, valueGetter: (value, row) => row.completedDate || '-' },
        actionColumn,
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
            valueGetter: (value, row) => (row.constructionStartDate && row.constructionEndDate ? `${row.constructionStartDate} ~ ${row.constructionEndDate}` : '-'),
        },
        actionColumn,
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
            valueGetter: (value, row) => (row.updateDate ? row.updateDate.substring(0, 10) : '-'),
        },
        actionColumn,
    ];

    const reportColumns = [
        { field: 'systemName', headerName: '시스템', flex: 1, sortable: false },
        {
            field: 'receivedAt',
            headerName: '수신일',
            flex: 1,
            sortable: false,
            valueGetter: (value, row) => (row.receivedAt ? dayjs(row.receivedAt).format('YYYY-MM-DD HH:mm:ss') : '-'),
        },
        reportActionColumn,
    ];

    const columns = isInspectionView
        ? inspectionColumns
        : isSupportOrFaultView
            ? supportFaultColumns
            : isConstructionView
                ? constructionColumns
                : isManagerView
                    ? managerColumns
                    : isReportView
                        ? reportColumns
                        : defaultColumns;

    const handleVisitDateChange = (newValue) => {
        if (newValue && newValue.startOf('day').isAfter(today)) {
            setSnackbar({ open: true, message: '현재 이후의 날짜는 선택할 수 없습니다', severity: 'warning' });
            setForm((prev) => ({ ...prev, visitDate: null }));
            return;
        }

        setForm((prev) => ({ ...prev, visitDate: newValue ? newValue.format('YYYY-MM-DD') : null }));
    };

    const handleUpdate = async () => {
        if (
            !isManagerView &&
            (form.workType === WORK_TYPE.FAULT || form.workType === WORK_TYPE.SUPPORT) &&
            !form.completedDate
        ) {
            alert('장애조치와 기술지원 이력은 완료일이 필요합니다.');
            return;
        }

        if (!isManagerView && !form.visitDate) {
            setSnackbar({ open: true, message: '방문일을 선택해 주세요.', severity: 'warning' });
            return;
        }

        if (!isManagerView && form.visitDate > dayjs().format('YYYY-MM-DD')) {
            setSnackbar({ open: true, message: '현재 이후의 날짜는 선택할 수 없습니다', severity: 'warning' });
            return;
        }

        try {
            if (isManagerView) {
                const response = await fetch(`/api/service-manager/${selectedRow.managerId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });

                if (!response.ok) {
                    throw new Error('담당자 수정에 실패했습니다.');
                }
            } else {
                const formData = new FormData();
                formData.append('data', new Blob([JSON.stringify({
                    issue: form.issue,
                    issueDetail: form.workType === WORK_TYPE.INSPECTION ? null : form.issueDetail,
                    equipment: form.equipment,
                    visitDate: form.visitDate,
                    completedDate: form.completedDate,
                    constructionStartDate: form.constructionStartDate,
                    constructionEndDate: form.constructionEndDate,
                })], { type: 'application/json' }), 'data.json');
                editFiles.forEach((file) => formData.append('files', file));

                const query = buildAttachmentQuery(retainedAttachments);
                const url = query ? `/api/history/with-files/${selectedRow.historyId}?${query}` : `/api/history/with-files/${selectedRow.historyId}`;

                const response = await fetch(url, {
                    method: 'PUT',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('이력 수정에 실패했습니다.');
                }
            }

            setOpenEdit(false);
            setEditFiles([]);
            setRetainedAttachments([]);
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error(error);
            alert(error.message || '수정에 실패했습니다.');
        }
    };

    const handleDelete = async () => {
        const url = isManagerView ? `/api/service-manager/${selectedRow.managerId}` : `/api/history/${selectedRow.historyId}`;
        await fetch(url, { method: 'DELETE' });
        setOpenDelete(false);
        if (onRefresh) {
            onRefresh();
        }
    };

    return (
        <>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <DataGrid
                    rows={displayRows}
                    columns={columns}
                    getRowId={(row) => (isManagerView ? row.managerId : isReportView ? row.id : row.historyId)}
                    localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
                    onRowClick={(params) => {
                        if (isReportView) {
                            return;
                        }
                        setSelectedRow(params.row);
                        setOpenDetail(true);
                    }}
                    checkboxSelection={isReportView}
                    onRowSelectionModelChange={(selection) => {
                        if (isReportView) {
                            setSelectedReportIds(normalizeReportSelection(selection));
                        }
                    }}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    pageSizeOptions={[10, 20, 50]}
                    disableColumnResize
                    disableRowSelectionOnClick
                    disableColumnSorting
                    disableColumnFilter
                    rowHeight={isMobile ? 46 : 52}
                    getRowClassName={(params) => (expandedRows[params.row.historyId] ? 'row-expanded' : '')}
                    sx={{
                        minWidth: {
                            xs: isManagerView ? 760 : isReportView ? 620 : isInspectionView ? 520 : isGlobalView ? 760 : 900,
                            md: 'auto',
                        },
                        '& .row-expanded': { backgroundColor: 'action.hover' },
                        '& .MuiDataGrid-cell[data-field="expand"]': { borderRight: 'none' },
                        '& .MuiDataGrid-columnHeader[data-field="expand"]': { borderRight: 'none' },
                        '& .MuiDataGrid-columnHeader[data-field="expand"] .MuiDataGrid-columnSeparator': { display: 'none' },
                        '& .MuiDataGrid-columnHeaders': {
                            minHeight: isMobile ? 42 : undefined,
                            maxHeight: isMobile ? 42 : undefined,
                        },
                        '& .MuiDataGrid-cell': {
                            fontSize: isMobile ? 13 : undefined,
                        },
                    }}
                />

                {isReportView && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={() => handleGenerateReports(selectedReportIds)}
                            disabled={selectedReportIds.length === 0}
                        >
                            선택 점검서 생성
                        </Button>
                    </Box>
                )}

                {!isManagerView && !isGlobalView && !isInspectionView && !isReportView && rows.map((row) => (
                    <Collapse key={row.historyId} in={!!expandedRows[row.historyId]} timeout={300} unmountOnExit>
                        <Box sx={{ mt: 2, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                            <Box sx={{ px: 2, py: 1, backgroundColor: 'grey.100', display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>📥 {row.issue || '(제목 없음)'} · {row.visitDate}</Typography>
                                <Button size="small" onClick={() => { setSelectedRow(row); setOpenDetail(true); }}>상세보기</Button>
                            </Box>
                            <SubHistoryPanel historyId={row.historyId} expanded />
                        </Box>
                    </Collapse>
                ))}

                <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{isManagerView ? '담당자 수정' : '이력 수정'}</DialogTitle>
                    <DialogContent>
                        {isManagerView ? (
                            <>
                                <TextField fullWidth margin="dense" label="담당자명" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                <TextField fullWidth margin="dense" label="부서명" value={form.dept || ''} onChange={(e) => setForm({ ...form, dept: e.target.value })} />
                                <TextField fullWidth margin="dense" label="전화번호" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                <TextField fullWidth margin="dense" label="이메일" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </>
                        ) : (
                            <>
                                <TextField fullWidth margin="dense" label="작업 유형" value={form.workType || ''} InputProps={{ readOnly: true }} />
                                <TextField fullWidth margin="dense" label="내용" value={form.issue || ''} onChange={(e) => setForm({ ...form, issue: e.target.value })} />
                                {form.workType !== WORK_TYPE.INSPECTION && (
                                    <AutoResizeTextField
                                        fullWidth
                                        margin="dense"
                                        label="내용 상세"
                                        minRows={10}
                                        value={form.issueDetail || ''}
                                        onChange={(e) => setForm({ ...form, issueDetail: e.target.value })}
                                        sx={textareaSx}
                                    />
                                )}

                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="방문일"
                                        value={form.visitDate ? dayjs(form.visitDate) : null}
                                        onChange={handleVisitDateChange}
                                        maxDate={today}
                                        format="YYYY-MM-DD"
                                        slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                                    />
                                </LocalizationProvider>

                                {(form.workType === WORK_TYPE.FAULT || form.workType === WORK_TYPE.SUPPORT) && (
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="완료일"
                                            value={form.completedDate ? dayjs(form.completedDate) : null}
                                            onChange={(newValue) => setForm((prev) => ({ ...prev, completedDate: newValue ? newValue.format('YYYY-MM-DD') : null }))}
                                            format="YYYY-MM-DD"
                                            slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                                        />
                                    </LocalizationProvider>
                                )}

                                {form.workType === WORK_TYPE.CONSTRUCTION && (
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker label="구축 시작일" value={form.constructionStartDate ? dayjs(form.constructionStartDate) : null} onChange={(newValue) => setForm((prev) => ({ ...prev, constructionStartDate: newValue ? newValue.format('YYYY-MM-DD') : null }))} format="YYYY-MM-DD" slotProps={{ textField: { fullWidth: true, margin: 'dense' } }} />
                                        <DatePicker label="구축 종료일" value={form.constructionEndDate ? dayjs(form.constructionEndDate) : null} onChange={(newValue) => setForm((prev) => ({ ...prev, constructionEndDate: newValue ? newValue.format('YYYY-MM-DD') : null }))} format="YYYY-MM-DD" slotProps={{ textField: { fullWidth: true, margin: 'dense' } }} />
                                    </LocalizationProvider>
                                )}

                                <Box sx={{ mt: 2 }}>
                                    <AttachmentEditor retainedAttachments={retainedAttachments} setRetainedAttachments={setRetainedAttachments} editFiles={editFiles} setEditFiles={setEditFiles} />
                                </Box>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenEdit(false)}>취소</Button>
                        <Button variant="contained" onClick={handleUpdate}>수정</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
                    <DialogTitle>삭제 확인</DialogTitle>
                    <DialogContent>정말 삭제하시겠습니까?</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDelete(false)}>취소</Button>
                        <Button color="error" variant="contained" onClick={handleDelete}>삭제</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth>
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
                                {selectedRow.workType !== WORK_TYPE.INSPECTION && <Typography><b>시스템:</b> {selectedRow.systemName}</Typography>}
                                <Typography><b>작업 유형:</b> {selectedRow.workType}</Typography>
                                <Typography><b>작업자:</b> {selectedRow.workerName}</Typography>
                                <Typography><b>방문일:</b> {selectedRow.visitDate}</Typography>
                                {selectedRow.workType !== WORK_TYPE.CONSTRUCTION && selectedRow.workType !== WORK_TYPE.INSPECTION && <Typography><b>완료일:</b> {selectedRow.completedDate || '-'}</Typography>}
                                {selectedRow.workType === WORK_TYPE.CONSTRUCTION && <Typography><b>구축기간:</b> {selectedRow.constructionStartDate || '-'} ~ {selectedRow.constructionEndDate || '-'}</Typography>}
                                <Typography><b>내용:</b> {selectedRow.issue}</Typography>
                                {selectedRow.issueDetail && (
                                    <Box>
                                        <Typography sx={{ fontWeight: 700 }}>내용 상세</Typography>
                                        <Typography sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{selectedRow.issueDetail}</Typography>
                                    </Box>
                                )}
                                <Typography sx={{ fontWeight: 700 }}>첨부파일</Typography>
                                <AttachmentPreviewList attachments={selectedRow.attachments} />
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
