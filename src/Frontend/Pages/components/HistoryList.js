import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import { DataGrid } from '@mui/x-data-grid';
import { koKR } from '@mui/x-data-grid/locales';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { useState } from 'react';

export default function HistoryList({ rows, isGlobalView, onRefresh, filter }) {

    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [form, setForm] = useState({});
    const [openDetail, setOpenDetail] = useState(false);

    const isInspectionView = !isGlobalView && filter === '정기점검';
    const isSupportOrFaultView = !isGlobalView && (filter === '기술지원' || filter === '장애조치');
    const isConstructionView = !isGlobalView && filter === '구축';
    const isManagerView = !isGlobalView && filter === '기관정보';

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
        { field: 'systemName', headerName: '시스템', flex: 1, sortable: false },
        { field: 'issue', headerName: '내용', flex: 1.5, sortable: false },
        { field: 'workerName', headerName: '작업자', flex: 0.8, sortable: false },
        { field: 'visitDate', headerName: '방문일', flex: 0.8, sortable: false },
        { field: 'completedDate', headerName: '완료일', flex: 0.8, sortable: false, valueGetter: (value, row) => row.completedDate || '-' },
        actionColumn
    ];

    const constructionColumns = [
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
            />

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
                            <Typography><b>시스템:</b> {selectedRow.systemName}</Typography>
                            <Typography><b>작업 유형:</b> {selectedRow.workType}</Typography>
                            <Typography><b>작업자:</b> {selectedRow.workerName}</Typography>
                            <Typography><b>방문일:</b> {selectedRow.visitDate}</Typography>
                            {selectedRow.workType !== '구축' && (
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
        </>
    );
}