import { DataGrid } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';

import { Divider, useMediaQuery } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
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
        <div style={{ lineHeight: 1.4 }}>
          <div style={{ fontWeight: 600 }}>
            {params.row.customerName}
          </div>

          <div style={{ fontSize: 12, color: '#666' }}>
            {params.row.serviceNameMin} / {params.row.systemNameMin} / {params.row.osIp}
          </div>
        </div>
      )
    }
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
        density="compact"
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
    </>
  );
}