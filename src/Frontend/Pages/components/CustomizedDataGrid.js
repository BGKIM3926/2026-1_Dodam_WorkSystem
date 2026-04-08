import { DataGrid } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Divider, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { koKR } from '@mui/x-data-grid/locales';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// 🔥 추가
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

export default function CustomizedDataGrid() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const { selectedNode } = useSelectedNode();

  const [selectedRow, setSelectedRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const isMobile = useMediaQuery('(max-width:600px)');

  // 🔥 추가 (핵심)
  const [customerFilter, setCustomerFilter] = useState('');

  // 수정 모달 상태
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editAccounts, setEditAccounts] = useState([]);
  const [saving, setSaving] = useState(false);

  // 🔥 고객명 목록 생성
  const customerList = [...new Set(rows.map(r => r.customerName))];

  // 🔥 필터링된 rows
  const filteredRows = rows.filter((row) => {
    if (!customerFilter) return true;
    return row.customerName === customerFilter;
  });

  const handleRowClick = async (params) => {
    const systemId = params.row.systemID;

    setSelectedRow(params.row);
    setModalOpen(true);

    setLoadingAccount(true);

    try {
      const res = await fetch(
        `http://localhost:8080/api/account?systemId=${systemId}`
      );

      const data = await res.json();
      setAccountData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAccount(false);
    }
  };

  // 수정 버튼 클릭
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
    });

    try {
      const res = await fetch(`http://localhost:8080/api/account?systemId=${row.systemID}`);
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

  const handleAccountChange = (index, field, value) => {
    setEditAccounts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddAccount = () => {
    setEditAccounts((prev) => [
      ...prev,
      { _key: Date.now(), systemType: '', accessType: '', portNumber: '', accountId: '', accountPw: '' },
    ]);
  };

  const handleRemoveAccount = (index) => {
    setEditAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        customerName: editForm.customerName,
        serviceName: editForm.serviceName,
        serviceNameMin: editForm.serviceNameMin,
        systemName: editForm.systemName,
        systemNameMin: editForm.systemNameMin,
        hardwareName: editForm.hardwareName,
        hardwareInfo: editForm.hardwareInfo,
        osName: editForm.osName,
        osIp: editForm.osIp,
        osInfo: editForm.osInfo,
        accounts: editAccounts.map((acc) => ({
          id: acc.id != null ? acc.id : null,
          systemType: acc.systemType,
          accessType: acc.accessType,
          portNumber: acc.portNumber,
          accountId: acc.accountId,
          accountPw: acc.accountPw,
        })),
      };

      const res = await fetch(`http://localhost:8080/api/dsystem/${editForm.systemID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('수정 실패');

      // 데이터 그리드 새로고침
      const refreshRes = await fetch('http://localhost:8080/api/dsystem');
      const refreshData = await refreshRes.json();
      setRows(refreshData.map((item, index) => ({ id: index, ...item })));

      setEditOpen(false);
    } catch (err) {
      console.error(err);
      alert('수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 🔥 핵심: customerName 컬럼만 dropdown 적용
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
      renderCell: (params) => (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div style={{ lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600 }}>
              {params.row.customerName}
            </div>

            <div style={{ fontSize: 12, color: '#666' }}>
              {params.row.serviceNameMin} / {params.row.systemNameMin} / {params.row.osIp}
            </div>
          </div>
        </div>
      )
    },
    {
      field: 'actions',
      headerName: '수정',
      width: 50,
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

  useEffect(() => {
    fetch('http://localhost:8080/api/dsystem')
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((item, index) => ({
          id: index,
          ...item
        }));
        setRows(mapped);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <DataGrid
        rows={filteredRows}   // 🔥 변경됨
        columns={isMobile ? mobileColumns : visibleColumns}
        localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
        onRowClick={handleRowClick}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[10, 20, 50]}
        disableColumnResize
        disableColumnFilter   // 🔥 기본 필터 제거
        rowHeight={52}
      />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth>
        <DialogContent>
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
            <Table size="small">
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
          )}
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>고객 정보 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField label="하드웨어명" size="small" value={editForm.hardwareName || ''} onChange={(e) => handleEditFormChange('hardwareName', e.target.value)} />
            <TextField label="OS명" size="small" value={editForm.osName || ''} onChange={(e) => handleEditFormChange('osName', e.target.value)} />
            <TextField label="IP" size="small" value={editForm.osIp || ''} onChange={(e) => handleEditFormChange('osIp', e.target.value)} />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField label="하드웨어 정보" size="small" fullWidth multiline rows={2} value={editForm.hardwareInfo || ''} onChange={(e) => handleEditFormChange('hardwareInfo', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { height: 'auto' } }} />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField label="OS 정보" size="small" fullWidth multiline rows={2} value={editForm.osInfo || ''} onChange={(e) => handleEditFormChange('osInfo', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { height: 'auto' } }} />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>계정 정보</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddAccount}>추가</Button>
          </Box>

          {editAccounts.map((acc, idx) => (
            <Box key={acc._key ?? idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField label="구분" size="small" value={acc.systemType || ''} onChange={(e) => handleAccountChange(idx, 'systemType', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="접속방식" size="small" value={acc.accessType || ''} onChange={(e) => handleAccountChange(idx, 'accessType', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="포트" size="small" value={acc.portNumber || ''} onChange={(e) => handleAccountChange(idx, 'portNumber', e.target.value)} sx={{ flex: 0.7 }} />
              <TextField label="계정명" size="small" value={acc.accountId || ''} onChange={(e) => handleAccountChange(idx, 'accountId', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="패스워드" size="small" value={acc.accountPw || ''} onChange={(e) => handleAccountChange(idx, 'accountPw', e.target.value)} sx={{ flex: 1 }} />
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
    </>
  );
}