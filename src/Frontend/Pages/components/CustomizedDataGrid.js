import { DataGrid } from '@mui/x-data-grid';
import { columns } from '../internals/data/gridData';
import { useEffect, useState } from 'react';


export default function CustomizedDataGrid() {
  const [rows, setRows] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [open, setOpen] = useState(false);

  const [expandedRow, setExpandedRow] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [expandedRowIds, setExpandedRowIds] = useState([]);

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
    <DataGrid
      rows={rows}
      columns={columns}
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
  );
}
