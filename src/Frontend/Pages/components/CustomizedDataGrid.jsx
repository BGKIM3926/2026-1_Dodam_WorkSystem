import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useMediaQuery } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import { koKR } from '@mui/x-data-grid/locales';
import { useEffect, useState } from 'react';

const STATUS_TEXT = {
  NEW: '신규',
  UPDATED: '수정',
  DELETED: '삭제',
};

const statusChipColor = (status) => {
  if (status === 'NEW') return 'success';
  if (status === 'UPDATED') return 'warning';
  if (status === 'DELETED') return 'error';
  return 'default';
};

const isExcelFile = (file) => {
  if (!file) return false;
  const lower = file.name.toLowerCase();
  return lower.endsWith('.xlsx') || lower.endsWith('.xls');
};

const createEmptySystemForm = () => ({
  customerName: '',
  serviceName: '',
  serviceNameMin: '',
  systemName: '',
  systemNameMin: '',
  hardwareName: '',
  hardwareInfo: '',
  osName: '',
  osIp: '',
  osInfo: '',
  status: 'SAFE',
});

const createEmptyAccount = () => ({
  _key: Date.now() + Math.random(),
  systemType: '',
  accessType: '',
  portNumber: '',
  accountId: '',
  accountPw: '',
});

const hasCustomerGridContent = (row) => (
  [
    row.customerName,
    row.serviceNameMin,
    row.systemNameMin,
    row.hardwareName,
    row.osName,
    row.osIp,
  ].some((value) => String(value ?? '').trim())
);

export default function CustomizedDataGrid() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRow, setSelectedRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const isMobile = useMediaQuery('(max-width:600px)');

  const [customerFilter, setCustomerFilter] = useState('');
  const [versionFilter, setVersionFilter] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editAccounts, setEditAccounts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(createEmptySystemForm());
  const [addAccounts, setAddAccounts] = useState([]);
  const [adding, setAdding] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState('dsystem');
  const [bulkError, setBulkError] = useState('');
  const [dsystemFile, setDsystemFile] = useState(null);
  const [dsystemPreview, setDsystemPreview] = useState(null);
  const [dsystemNoChange, setDsystemNoChange] = useState(false);
  const [previewingDSystem, setPreviewingDSystem] = useState(false);
  const [dsystemAccountFile, setDsystemAccountFile] = useState(null);
  const [dsystemAccountPreview, setDsystemAccountPreview] = useState(null);
  const [previewingAccount, setPreviewingAccount] = useState(false);
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [isDsystemDragging, setIsDsystemDragging] = useState(false);
  const [isDsystemAccountDragging, setIsDsystemAccountDragging] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportingDSystem, setExportingDSystem] = useState(false);
  const [exportingDSystemAccount, setExportingDSystemAccount] = useState(false);

  const responsiveFormGridSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
    gap: 2,
    mt: 1,
  };

  const accountRowSx = {
    display: 'flex',
    gap: 1,
    mb: 1,
    alignItems: 'center',
    flexDirection: { xs: 'column', sm: 'row' },
  };

  const customerList = [...new Set(rows.map((r) => r.customerName).filter(Boolean))];

  const filteredRows = rows.filter((row) => {
    const matchCustomer = !customerFilter || row.customerName === customerFilter;
    const matchVersion = !versionFilter || (row.version || '신') === versionFilter;
    return matchCustomer && matchVersion;
  });

  const fetchSystems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dsystem');
      const data = await res.json();
      const mapped = data
        .filter(hasCustomerGridContent)
        .map((item, index) => ({ id: item.systemID ?? index, ...item, version: item.version || '신' }));
      setRows(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystems();
    window.addEventListener('system-version-updated', fetchSystems);
    return () => window.removeEventListener('system-version-updated', fetchSystems);
  }, []);

  const handleRowClick = async (params) => {
    const systemId = params.row.systemID;
    setSelectedRow(params.row);
    setModalOpen(true);
    setLoadingAccount(true);

    try {
      const res = await fetch(`/api/account?systemId=${systemId}`);
      const data = await res.json();
      setAccountData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleEditClick = async (e, row) => {
    e.stopPropagation();
    setEditForm({
      systemID: row.systemID,
      customerName: row.customerName || '',
      serviceName: row.serviceName || '',
      serviceNameMin: row.serviceNameMin || '',
      systemName: row.systemName || '',
      systemNameMin: row.systemNameMin || '',
      hardwareName: row.hardwareName || '',
      hardwareInfo: row.hardwareInfo || '',
      osName: row.osName || '',
      osIp: row.osIp || '',
      osInfo: row.osInfo || '',
      status: row.status || 'SAFE',
    });

    try {
      const res = await fetch(`/api/account?systemId=${row.systemID}`);
      const data = await res.json();
      setEditAccounts(data.map((acc, idx) => ({ ...acc, _key: idx })));
    } catch (err) {
      console.error(err);
      setEditAccounts([]);
    }

    setEditOpen(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFormChange = (field, value) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAccountChange = (index, field, value) => {
    setEditAccounts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddAccountChange = (index, field, value) => {
    setAddAccounts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddAccount = () => {
    setEditAccounts((prev) => [
      ...prev,
      createEmptyAccount(),
    ]);
  };

  const handleAddAccountForCreate = () => {
    setAddAccounts((prev) => [
      ...prev,
      createEmptyAccount(),
    ]);
  };

  const handleRemoveAccount = (index) => {
    setEditAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAddAccount = (index) => {
    setAddAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const openAddDialog = () => {
    setAddForm(createEmptySystemForm());
    setAddAccounts([]);
    setAddOpen(true);
  };

  const validateRequiredNames = (form) => {
    if (!form.customerName?.trim()) return '사이트명은 필수 입력값입니다.';
    if (!form.serviceNameMin?.trim()) return '서비스명은 필수 입력값입니다.';
    if (!form.systemNameMin?.trim()) return '시스템명은 필수 입력값입니다.';
    return '';
  };

  const toSystemPayload = (form, accounts, includeAccountId) => ({
    customerName: form.customerName,
    serviceName: form.serviceName || form.serviceNameMin,
    serviceNameMin: form.serviceNameMin,
    systemName: form.systemName || form.systemNameMin,
    systemNameMin: form.systemNameMin,
    hardwareName: form.hardwareName,
    hardwareInfo: form.hardwareInfo,
    osName: form.osName,
    osIp: form.osIp,
    osInfo: form.osInfo,
    status: form.status || 'SAFE',
    accounts: accounts.map((acc) => {
      const payload = {
        systemType: acc.systemType,
        accessType: acc.accessType,
        portNumber: acc.portNumber,
        accountId: acc.accountId,
        accountPw: acc.accountPw,
      };
      if (includeAccountId) {
        payload.id = acc.id != null ? acc.id : null;
      }
      return payload;
    }),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = toSystemPayload(editForm, editAccounts, true);

      const res = await fetch(`/api/dsystem/${editForm.systemID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('수정 실패');

      await fetchSystems();
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      alert('수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const requiredMessage = validateRequiredNames(addForm);
    if (requiredMessage) {
      alert(requiredMessage);
      return;
    }

    setAdding(true);
    try {
      const body = toSystemPayload(addForm, addAccounts, false);
      const res = await fetch('/api/dsystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || '등록에 실패했습니다.');
      }

      await fetchSystems();
      setAddOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message || '등록에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const resetBulkState = () => {
    setBulkStep('dsystem');
    setBulkError('');
    setDsystemFile(null);
    setDsystemPreview(null);
    setDsystemNoChange(false);
    setDsystemAccountFile(null);
    setDsystemAccountPreview(null);
  };

  const openBulkDialog = () => {
    resetBulkState();
    setBulkOpen(true);
  };

  const closeBulkDialog = () => {
    setBulkOpen(false);
    resetBulkState();
  };

  const openExportDialog = () => {
    setExportError('');
    setExportOpen(true);
  };

  const closeExportDialog = () => {
    if (exportingDSystem || exportingDSystemAccount) return;
    setExportOpen(false);
    setExportError('');
  };

  const getExportUrl = (target) => {
    const params = new URLSearchParams();
    if (customerFilter) {
      params.set('customerName', customerFilter);
    }
    const query = params.toString();
    return `/api/dsystem/export/${target}${query ? `?${query}` : ''}`;
  };

  const getFilenameFromDisposition = (disposition, fallbackName) => {
    if (!disposition) return fallbackName;
    const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch?.[1]) {
      return decodeURIComponent(utfMatch[1]);
    }
    const basicMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
    return basicMatch?.[1] || fallbackName;
  };

  const downloadBlobFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportDownload = async (target) => {
    const isDsystem = target === 'dsystem';
    const setLoading = isDsystem ? setExportingDSystem : setExportingDSystemAccount;
    const fallbackName = isDsystem ? 'dsystem.xlsx' : 'dsystemaccount.xlsx';

    setLoading(true);
    setExportError('');
    try {
      const res = await fetch(getExportUrl(target));
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || '엑셀 내보내기에 실패했습니다.');
      }
      const blob = await res.blob();
      const filename = getFilenameFromDisposition(res.headers.get('Content-Disposition'), fallbackName);
      downloadBlobFile(blob, filename);
    } catch (err) {
      setExportError(err.message || '엑셀 내보내기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const parseErrorText = async (res) => {
    const text = await res.text();
    return text || '요청 처리 중 오류가 발생했습니다.';
  };

  const handleDsystemFileSelected = (file) => {
    if (!file) return;
    if (!isExcelFile(file)) {
      setBulkError('dsystem 파일은 .xlsx 또는 .xls 형식만 가능합니다.');
      return;
    }
    setDsystemFile(file);
    setDsystemNoChange(false);
    setDsystemPreview(null);
    setBulkError('');
  };

  const handleDsystemAccountFileSelected = (file) => {
    if (!file) return;
    if (!isExcelFile(file)) {
      setBulkError('dsystemaccount 파일은 .xlsx 또는 .xls 형식만 가능합니다.');
      return;
    }
    setDsystemAccountFile(file);
    setDsystemAccountPreview(null);
    setBulkError('');
  };

  const handlePreviewDSystem = async () => {
    if (!dsystemFile) {
      setBulkError('dsystem 엑셀 파일을 선택해 주세요.');
      return;
    }
    if (!isExcelFile(dsystemFile)) {
      setBulkError('dsystem 파일은 .xlsx 또는 .xls 형식만 가능합니다.');
      return;
    }

    setPreviewingDSystem(true);
    setBulkError('');

    try {
      const formData = new FormData();
      formData.append('file', dsystemFile);

      const res = await fetch('/api/dsystem/bulk-sync/preview/dsystem', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await parseErrorText(res));
      }

      const data = await res.json();
      setDsystemPreview(data);
      setDsystemNoChange(false);
    } catch (err) {
      setBulkError(err.message || 'dsystem 미리보기 처리에 실패했습니다.');
    } finally {
      setPreviewingDSystem(false);
    }
  };

  const handleDSystemNoChange = () => {
    setDsystemNoChange(true);
    setDsystemPreview({
      target: 'dsystem',
      summary: { created: 0, updated: 0, deleted: 0, totalChanged: 0 },
      changes: [],
    });
    setBulkError('');
    setBulkStep('dsystemaccount');
  };

  const handlePreviewDSystemAccount = async () => {
    if (!dsystemAccountFile) {
      setBulkError('dsystemaccount 엑셀 파일을 선택해 주세요.');
      return;
    }
    if (!isExcelFile(dsystemAccountFile)) {
      setBulkError('dsystemaccount 파일은 .xlsx 또는 .xls 형식만 가능합니다.');
      return;
    }

    setPreviewingAccount(true);
    setBulkError('');

    try {
      const formData = new FormData();
      formData.append('file', dsystemAccountFile);

      const res = await fetch('/api/dsystem/bulk-sync/preview/dsystemaccount', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await parseErrorText(res));
      }

      const data = await res.json();
      setDsystemAccountPreview(data);
    } catch (err) {
      setBulkError(err.message || 'dsystemaccount 미리보기 처리에 실패했습니다.');
    } finally {
      setPreviewingAccount(false);
    }
  };

  const handleGoToDSystemAccountStep = () => {
    if (!dsystemNoChange && !dsystemPreview) {
      setBulkError('dsystem 미리보기를 먼저 실행하거나 변동 없음을 선택해 주세요.');
      return;
    }
    setBulkError('');
    setBulkStep('dsystemaccount');
  };

  const handleGoToConfirmStep = () => {
    if (!dsystemAccountPreview) {
      setBulkError('dsystemaccount 미리보기를 먼저 실행해 주세요.');
      return;
    }
    setBulkError('');
    setBulkStep('confirm');
  };

  const handleApplyBulk = async () => {
    if (!dsystemNoChange && !dsystemFile) {
      setBulkError('dsystem 파일 또는 변동 없음 선택이 필요합니다.');
      return;
    }
    if (!dsystemAccountFile) {
      setBulkError('dsystemaccount 파일 업로드가 필요합니다.');
      return;
    }

    setApplyingBulk(true);
    setBulkError('');

    try {
      const formData = new FormData();
      formData.append('dsystemNoChange', String(dsystemNoChange));
      if (!dsystemNoChange && dsystemFile) {
        formData.append('dsystemFile', dsystemFile);
      }

      formData.append('dsystemAccountNoChange', 'false');
      formData.append('dsystemAccountFile', dsystemAccountFile);

      const res = await fetch('/api/dsystem/bulk-sync/apply', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await parseErrorText(res));
      }

      const data = await res.json();
      await fetchSystems();
      closeBulkDialog();
      alert(data.message || '엑셀 일괄 최신화가 완료되었습니다.');
    } catch (err) {
      setBulkError(err.message || '일괄 최신화 적용에 실패했습니다.');
    } finally {
      setApplyingBulk(false);
    }
  };

  const renderChangeSummary = (preview) => {
    if (!preview?.summary) return null;
    const summary = preview.summary;
    return (
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
        <Chip color="success" label={`신규 ${summary.created ?? 0}건`} />
        <Chip color="warning" label={`수정 ${summary.updated ?? 0}건`} />
        <Chip color="error" label={`삭제 ${summary.deleted ?? 0}건`} />
      </Stack>
    );
  };

  const renderChangeTable = (preview) => {
    if (!preview?.changes || preview.changes.length === 0) {
      return <Typography variant="body2" color="text.secondary">변동 사항이 없습니다.</Typography>;
    }

    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>상태</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>키</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>변경 필드</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {preview.changes.map((row, idx) => (
            <TableRow key={`${row.key}-${idx}`}>
              <TableCell>
                <Chip size="small" color={statusChipColor(row.status)} label={STATUS_TEXT[row.status] || row.status} />
              </TableCell>
              <TableCell>{row.key}</TableCell>
              <TableCell>{(row.changedFields || []).join(', ') || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const visibleColumns = [
    {
      field: 'customerName',
      headerName: '고객명',
      flex: 1,
      sortable: false,
      filterable: false,
      renderHeader: () => (
        <FormControl size="small" fullWidth>
          <Select
            value={customerFilter}
            displayEmpty
            onChange={(e) => setCustomerFilter(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            sx={{ fontSize: 14 }}
          >
            <MenuItem value="">
              <em>사이트명</em>
            </MenuItem>
            {customerList.map((customer) => (
              <MenuItem key={customer} value={customer}>
                {customer}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ),
    },
    { field: 'serviceNameMin', headerName: '서비스명', flex: 1, sortable: false, filterable: false },
    { field: 'systemNameMin', headerName: '시스템명', flex: 1, sortable: false, filterable: false },
    {
      field: 'version',
      headerName: '버전',
      width: 120,
      sortable: false,
      filterable: false,
      renderHeader: () => (
        <FormControl size="small" fullWidth>
          <Select
            value={versionFilter}
            displayEmpty
            onChange={(e) => setVersionFilter(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            sx={{ fontSize: 14 }}
          >
            <MenuItem value="">
              <em>전체</em>
            </MenuItem>
            <MenuItem value="신">신</MenuItem>
            <MenuItem value="구">구</MenuItem>
          </Select>
        </FormControl>
      ),
      renderCell: (params) => params.row.version || '신',
    },
    { field: 'hardwareName', headerName: '하드웨어', flex: 1, sortable: false, filterable: false },
    { field: 'osName', headerName: 'OS', flex: 1, sortable: false, filterable: false },
    { field: 'osIp', headerName: 'IP', flex: 1, sortable: false, filterable: false },
    {
      field: 'actions',
      headerName: '수정',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <IconButton size="small" sx={{ border: 'none' }} onClick={(e) => handleEditClick(e, params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const mobileColumns = [
    {
      field: 'customerName',
      headerName: '고객 정보',
      flex: 1,
      sortable: false,
      filterable: false,
      renderHeader: () => (
        <FormControl size="small" fullWidth>
          <Select
            value={customerFilter}
            displayEmpty
            onChange={(e) => setCustomerFilter(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            sx={{ fontSize: 14 }}
          >
            <MenuItem value="">
              <em>사이트명</em>
            </MenuItem>
            {customerList.map((customer) => (
              <MenuItem key={customer} value={customer}>
                {customer}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ),
      renderCell: (params) => (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div style={{ lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600 }}>{params.row.customerName}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {params.row.serviceNameMin} / {params.row.systemNameMin} / {params.row.osIp} / {params.row.version || '신'}
            </div>
          </div>
        </div>
      ),
    },
  ];
  return (
    <>
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-end', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={openAddDialog} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          행 추가
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={openExportDialog} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          엑셀 내보내기
        </Button>
        <Button variant="contained" startIcon={<FileUploadIcon />} onClick={openBulkDialog} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          엑셀 가져오기
        </Button>
      </Box>

      <DataGrid
        rows={filteredRows}
        columns={isMobile ? mobileColumns : visibleColumns}
        loading={loading}
        localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
        onRowClick={handleRowClick}
        getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd')}
        initialState={{ pagination: { paginationModel: { pageSize: isMobile ? 8 : 10 } } }}
        pageSizeOptions={[10, 20, 50]}
        autoHeight={isMobile}
        disableVirtualization={isMobile}
        disableColumnResize
        disableColumnFilter
        rowHeight={isMobile ? 104 : 52}
        sx={{
          ...(isMobile && {
            borderLeft: 0,
            borderRight: 0,
            '& .MuiDataGrid-main': {
              overflow: 'visible',
            },
            '& .MuiDataGrid-virtualScroller': {
              overflow: 'visible !important',
              touchAction: 'pan-y',
            },
            '& .MuiDataGrid-row, & .MuiDataGrid-cell': {
              touchAction: 'pan-y',
            },
          }),
          '& .MuiDataGrid-columnHeaders': {
            minHeight: isMobile ? 56 : undefined,
            maxHeight: isMobile ? 56 : undefined,
            fontSize: isMobile ? 14 : undefined,
          },
          '& .MuiDataGrid-cell': {
            alignItems: isMobile ? 'flex-start' : 'center',
            py: isMobile ? 1 : 0,
            fontSize: isMobile ? 14 : undefined,
            lineHeight: isMobile ? 1.35 : undefined,
          },
          '& .MuiDataGrid-footerContainer': {
            minHeight: isMobile ? 44 : undefined,
          },
        }}
      />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {selectedRow && (
            <>
              <Typography>
                <strong>하드웨어 정보</strong>
                <br />
                {selectedRow.hardwareInfo}
              </Typography>
              <br />
              <Typography>
                <strong>OS 정보</strong>
                <br />
                {selectedRow.osInfo}
              </Typography>
            </>
          )}

          <br />
          <Divider />
          <br />

          {loadingAccount ? (
            <Typography>로딩 중...</Typography>
          ) : (
            <TableContainer sx={{ maxHeight: isMobile ? 280 : 'none' }}>
              <Table size="small" stickyHeader={isMobile}>
                <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>구분</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>접속방식</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>포트</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>계정명</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>패스워드</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {accountData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.systemType}</TableCell>
                    <TableCell>{row.accessType}</TableCell>
                    <TableCell>{row.portNumber}</TableCell>
                    <TableCell>{row.accountId}</TableCell>
                    <TableCell>{row.accountPw}</TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>고객 정보 등록</DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={responsiveFormGridSx}>
            <TextField
              label="사이트명"
              required
              size="small"
              value={addForm.customerName || ''}
              onChange={(e) => handleAddFormChange('customerName', e.target.value)}
            />
            <TextField
              label="서비스명"
              required
              size="small"
              value={addForm.serviceNameMin || ''}
              onChange={(e) => handleAddFormChange('serviceNameMin', e.target.value)}
            />
            <TextField
              label="시스템명"
              required
              size="small"
              value={addForm.systemNameMin || ''}
              onChange={(e) => handleAddFormChange('systemNameMin', e.target.value)}
            />
            <TextField
              label="서비스명(원본)"
              size="small"
              value={addForm.serviceName || ''}
              onChange={(e) => handleAddFormChange('serviceName', e.target.value)}
            />
            <TextField
              label="시스템명(원본)"
              size="small"
              value={addForm.systemName || ''}
              onChange={(e) => handleAddFormChange('systemName', e.target.value)}
            />
          </Box>

          <Box sx={{ ...responsiveFormGridSx, mt: 2 }}>
            <TextField label="하드웨어명" size="small" value={addForm.hardwareName || ''} onChange={(e) => handleAddFormChange('hardwareName', e.target.value)} />
            <TextField label="OS명" size="small" value={addForm.osName || ''} onChange={(e) => handleAddFormChange('osName', e.target.value)} />
            <TextField label="IP" size="small" value={addForm.osIp || ''} onChange={(e) => handleAddFormChange('osIp', e.target.value)} />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="하드웨어 정보"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={addForm.hardwareInfo || ''}
              onChange={(e) => handleAddFormChange('hardwareInfo', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { height: 'auto' } }}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="OS 정보"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={addForm.osInfo || ''}
              onChange={(e) => handleAddFormChange('osInfo', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { height: 'auto' } }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>계정 정보</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddAccountForCreate}>추가</Button>
          </Box>

          {addAccounts.map((acc, idx) => (
            <Box key={acc._key ?? idx} sx={accountRowSx}>
              <TextField label="구분" size="small" fullWidth value={acc.systemType || ''} onChange={(e) => handleAddAccountChange(idx, 'systemType', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="접속방식" size="small" fullWidth value={acc.accessType || ''} onChange={(e) => handleAddAccountChange(idx, 'accessType', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="포트" size="small" fullWidth value={acc.portNumber || ''} onChange={(e) => handleAddAccountChange(idx, 'portNumber', e.target.value)} sx={{ flex: 0.7 }} />
              <TextField label="계정명" size="small" fullWidth value={acc.accountId || ''} onChange={(e) => handleAddAccountChange(idx, 'accountId', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="패스워드" size="small" fullWidth value={acc.accountPw || ''} onChange={(e) => handleAddAccountChange(idx, 'accountPw', e.target.value)} sx={{ flex: 1 }} />
              <IconButton size="small" color="error" onClick={() => handleRemoveAddAccount(idx)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleCreate} disabled={adding}>
            {adding ? '등록 중...' : '등록'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>고객 정보 수정</DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={responsiveFormGridSx}>
            <TextField label="하드웨어명" size="small" value={editForm.hardwareName || ''} onChange={(e) => handleEditFormChange('hardwareName', e.target.value)} />
            <TextField label="OS명" size="small" value={editForm.osName || ''} onChange={(e) => handleEditFormChange('osName', e.target.value)} />
            <TextField label="IP" size="small" value={editForm.osIp || ''} onChange={(e) => handleEditFormChange('osIp', e.target.value)} />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="하드웨어 정보"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={editForm.hardwareInfo || ''}
              onChange={(e) => handleEditFormChange('hardwareInfo', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { height: 'auto' } }}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="OS 정보"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={editForm.osInfo || ''}
              onChange={(e) => handleEditFormChange('osInfo', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { height: 'auto' } }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>계정 정보</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddAccount}>추가</Button>
          </Box>

          {editAccounts.map((acc, idx) => (
            <Box key={acc._key ?? idx} sx={accountRowSx}>
              <TextField label="구분" size="small" fullWidth value={acc.systemType || ''} onChange={(e) => handleAccountChange(idx, 'systemType', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="접속방식" size="small" fullWidth value={acc.accessType || ''} onChange={(e) => handleAccountChange(idx, 'accessType', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="포트" size="small" fullWidth value={acc.portNumber || ''} onChange={(e) => handleAccountChange(idx, 'portNumber', e.target.value)} sx={{ flex: 0.7 }} />
              <TextField label="계정명" size="small" fullWidth value={acc.accountId || ''} onChange={(e) => handleAccountChange(idx, 'accountId', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="패스워드" size="small" fullWidth value={acc.accountPw || ''} onChange={(e) => handleAccountChange(idx, 'accountPw', e.target.value)} sx={{ flex: 1 }} />
              <IconButton size="small" color="error" onClick={() => handleRemoveAccount(idx)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkOpen} onClose={closeBulkDialog} fullWidth maxWidth="lg">
        <DialogTitle>엑셀 일괄 최신화</DialogTitle>
        <DialogContent>
          {(previewingDSystem || previewingAccount || applyingBulk) && <LinearProgress sx={{ mb: 2 }} />}

          {bulkError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {bulkError}
            </Alert>
          )}

          {bulkStep === 'dsystem' && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={600}>1단계: dsystem 업로드</Typography>
              <Typography variant="body2" color="text.secondary">
                dsystem 엑셀을 먼저 업로드하거나, 변경 사항이 없다면 변동 없음으로 다음 단계로 이동할 수 있습니다.
              </Typography>

              <Paper
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDsystemDragging(false);
                  handleDsystemFileSelected(e.dataTransfer.files?.[0] ?? null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDsystemDragging(true);
                }}
                onDragLeave={() => setIsDsystemDragging(false)}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: isDsystemDragging ? 'primary.main' : 'divider',
                  backgroundColor: isDsystemDragging ? 'action.hover' : 'transparent',
                }}
              >
                <CloudUploadIcon fontSize="large" />
                <Typography sx={{ mt: 1 }}>파일을 드래그하거나 클릭해서 업로드</Typography>
                <Button component="label" variant="outlined" startIcon={<FileUploadIcon />} sx={{ mt: 2 }}>
                  파일 선택
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleDsystemFileSelected(e.target.files?.[0] ?? null)}
                  />
                </Button>
              </Paper>

              <Typography variant="body2" color="text.secondary">
                선택 파일: {dsystemFile ? dsystemFile.name : '없음'}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handlePreviewDSystem} disabled={previewingDSystem}>
                  결과 미리보기
                </Button>
                <Button variant="outlined" onClick={handleDSystemNoChange} disabled={previewingDSystem}>
                  변동 없음
                </Button>
                <Button
                  variant="text"
                  onClick={handleGoToDSystemAccountStep}
                  disabled={previewingDSystem || (!dsystemNoChange && !dsystemPreview)}
                >
                  다음
                </Button>
              </Stack>

              {dsystemPreview && (
                <Box>
                  {renderChangeSummary(dsystemPreview)}
                  {renderChangeTable(dsystemPreview)}
                </Box>
              )}
            </Stack>
          )}

          {bulkStep === 'dsystemaccount' && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={600}>2단계: dsystemaccount 업로드</Typography>
              <Typography variant="body2" color="text.secondary">
                dsystemaccount 엑셀 업로드 후 기존 데이터와 비교 결과를 확인합니다.
              </Typography>

              <Paper
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDsystemAccountDragging(false);
                  handleDsystemAccountFileSelected(e.dataTransfer.files?.[0] ?? null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDsystemAccountDragging(true);
                }}
                onDragLeave={() => setIsDsystemAccountDragging(false)}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: isDsystemAccountDragging ? 'primary.main' : 'divider',
                  backgroundColor: isDsystemAccountDragging ? 'action.hover' : 'transparent',
                }}
              >
                <CloudUploadIcon fontSize="large" />
                <Typography sx={{ mt: 1 }}>파일을 드래그하거나 클릭해서 업로드</Typography>
                <Button component="label" variant="outlined" startIcon={<FileUploadIcon />} sx={{ mt: 2 }}>
                  파일 선택
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleDsystemAccountFileSelected(e.target.files?.[0] ?? null)}
                  />
                </Button>
              </Paper>

              <Typography variant="body2" color="text.secondary">
                선택 파일: {dsystemAccountFile ? dsystemAccountFile.name : '없음'}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handlePreviewDSystemAccount} disabled={previewingAccount}>
                  결과 미리보기
                </Button>
                <Button
                  variant="text"
                  onClick={handleGoToConfirmStep}
                  disabled={previewingAccount || !dsystemAccountPreview}
                >
                  다음
                </Button>
                <Button variant="text" onClick={() => setBulkStep('dsystem')} disabled={previewingAccount}>
                  이전 단계로
                </Button>
              </Stack>

              {dsystemAccountPreview && (
                <Box>
                  {renderChangeSummary(dsystemAccountPreview)}
                  {renderChangeTable(dsystemAccountPreview)}
                </Box>
              )}
            </Stack>
          )}

          {bulkStep === 'confirm' && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={600}>3단계: 최종 확인</Typography>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>dsystem</Typography>
                {renderChangeSummary(dsystemPreview)}
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>dsystemaccount</Typography>
                {renderChangeSummary(dsystemAccountPreview)}
              </Box>

              <Alert severity="info">
                최종 적용 시 신규/수정/삭제가 즉시 반영되고 고객 정보 데이터 그리드가 최신화됩니다.
              </Alert>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeBulkDialog} disabled={applyingBulk}>닫기</Button>
          {bulkStep === 'confirm' ? (
            <Button variant="contained" onClick={handleApplyBulk} disabled={applyingBulk}>
              {applyingBulk ? '적용 중...' : '최신화 실행'}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Dialog open={exportOpen} onClose={closeExportDialog} fullWidth maxWidth="xs">
        <DialogTitle>엑셀 내보내기</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {customerFilter ? `현재 선택된 고객사(${customerFilter}) 기준으로 다운로드합니다.` : '전체 고객사 기준으로 다운로드합니다.'}
          </Typography>
          {exportError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {exportError}
            </Alert>
          )}
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={exportingDSystem || exportingDSystemAccount}
              onClick={() => handleExportDownload('dsystem')}
            >
              {exportingDSystem ? '다운로드 중...' : '고객 정보 다운로드'}
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={exportingDSystem || exportingDSystemAccount}
              onClick={() => handleExportDownload('dsystemaccount')}
            >
              {exportingDSystemAccount ? '다운로드 중...' : '계정 정보 다운로드'}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeExportDialog} disabled={exportingDSystem || exportingDSystemAccount}>닫기</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


