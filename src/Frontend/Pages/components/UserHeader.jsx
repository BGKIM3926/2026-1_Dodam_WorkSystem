import { Box, Typography } from '@mui/material';

export default function UserHeader({ rows }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2, mt: { xs: 1, md: 4 } }}>
            <Typography variant="h2" gutterBottom>
                인사 관리
            </Typography>

            <Typography variant="h4" color="text.secondary">
                인원: {rows.length}명
            </Typography>
        </Box>
    );
}
