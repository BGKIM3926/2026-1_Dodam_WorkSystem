import Typography from '@mui/material/Typography';
import MenuButton from './components/MenuButton';
import Stack from '@mui/material/Stack';
import CustomizedDataGrid from './components/CustomizedDataGrid';
import Grid from '@mui/material/Grid';
import { DataGrid } from '@mui/x-data-grid';
import CustomToolbar from './components/CustomToolbar';


export default function WorkHistory() {

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: '이름', width: 150 },
    ];

    const rows = [
        { id: 1, name: '홍길동' },
        { id: 2, name: '김철수' },
    ];
    return (
        <>
            <Stack spacing={2} sx={{ width: '100%' }} alignItems="flex-start">
                <Typography component="h2" variant="h6" sx={{ mb: 2 }}>이력 관리</Typography>

                <DataGrid
                    rows={rows}
                    columns={columns}
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
                
                
            </Stack>

            <CustomToolbar />

            
            
        </>
        
    );
}