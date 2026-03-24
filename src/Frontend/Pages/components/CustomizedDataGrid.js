import { DataGrid } from '@mui/x-data-grid';
import { columns } from '../internals/data/gridData';
import { useEffect, useState } from 'react';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';


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

  const filteredRows = rows.filter((row) => {
    if (!selectedNode) return true;

    const [customer, service] = selectedNode.split('-');

    if (service) {
      return (
        row.customerName === customer &&
        row.serviceNameMin === service
      );
    }

    return row.customerName === customer;
  });

  const handleRowClick = (params) => {
    setSelectedRow(params.row);
    setModalOpen(true);
  };

  const visibleColumns = [
    { field: 'customerName', headerName: '고객명', flex: 1 },
    { field: 'serviceName', headerName: '서비스명', flex: 1 },
    { field: 'systemName', headerName: '시스템명', flex: 1 },
    { field: 'hardwareName', headerName: '하드웨어', flex: 1 },
    { field: 'osName', headerName: 'OS', flex: 1 },
    { field: 'osIp', headerName: 'IP', flex: 1 },
  ];

  useEffect(() => {
    fetch('http://localhost:8080/api/dsystem') // 👉 백엔드 API
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
        rows={filteredRows}
        columns={visibleColumns}
        onRowClick={handleRowClick}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        initialState={{
          pagination: { paginationModel: { pageSize: 20 } },
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
        <DialogTitle>상세 정보</DialogTitle>

        <DialogContent>
          {selectedRow && (
            <>
              <Typography>하드웨어 정보: {selectedRow.hardwareInfo}</Typography>
              <Typography>OS 정보: {selectedRow.osInfo}</Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
    
    
  );
}
