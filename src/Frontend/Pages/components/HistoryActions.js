import { Stack, TextField, Button } from '@mui/material';

export default function HistoryActions() {
    return (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField size="small" placeholder="검색..." />
            <Button variant="contained">이력 등록</Button>
        </Stack>
    );
}