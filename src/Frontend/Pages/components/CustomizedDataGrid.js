import { DataGrid } from '@mui/x-data-grid'
import { columns } from '../internals/data/gridData';
import { useEffect, useState } from 'react';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import { Divider, useMediaQuery } from '@mui/material';
import { koKR } from '@mui/x-data-grid/locales';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';


export default function CustomizedDataGrid() {
  const [rows, setRows] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [open, setOpen] = useState(false);

  const [expandedRow, setExpandedRow] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [expandedRowIds, setExpandedRowIds] = useState([]);
  const { selectedNode } = useSelectedNode();

  const [selectedRow, setSelectedRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  // const filteredRows = rows.filter((row) => {
  //   if (!selectedNode) return true;

  //   const [customer, service] = selectedNode.split('-');

  //   if (service) {
  //     return (
  //       row.customerName === customer &&
  //       row.serviceNameMin === service
  //     );
  //   }

  //   return row.customerName === customer;
  // });

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

  const visibleColumns = [
    { field: 'customerName', headerName: '고객명', flex: 1 },
    { field: 'serviceNameMin', headerName: '서비스명', flex: 1 },
    { field: 'systemNameMin', headerName: '시스템명', flex: 1 },
    { field: 'hardwareName', headerName: '하드웨어', flex: 1 },
    { field: 'osName', headerName: 'OS', flex: 1 },
    { field: 'osIp', headerName: 'IP', flex: 1 },
  ];

  const mobileColumns = [
    {
      field: 'customerName',
      headerName: '고객명',
      flex: 1,
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
    fetch('http://localhost:8080/api/dsystem') // 👉 백엔드 API
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        console.log(rows);
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
        rows={rows}
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
        density="compact"
        slotProps={{
          filterPanel: {
            filterFormProps: {
              logicOperatorInputProps: {
                variant: 'outlined',
                size: 'small',
              },
              columnInputProps: {
                variant: 'outlined',
                size: 'small',
                sx: { mt: 'auto' },
              },
              operatorInputProps: {
                variant: 'outlined',
                size: 'small',
                sx: { mt: 'auto' },
              },
              valueInputProps: {
                InputComponentProps: {
                  variant: 'outlined',
                  size: 'small',
                },
              },
            },
          },
        }}
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
                  <TableCell>구분</TableCell>
                  <TableCell>접속방식</TableCell>
                  <TableCell>포트</TableCell>
                  <TableCell>계정명</TableCell>
                  <TableCell>패스워드</TableCell>
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
