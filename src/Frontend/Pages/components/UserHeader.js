import { Typography, Box } from '@mui/material';

export default function UserHeader({ selectedNode, rows }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2, mt: 4 }}>
            <Typography variant="h2" gutterBottom>
                인사 관리
            </Typography>

            <Typography variant="h4" color="text.secondary">
                인원:
            </Typography>
        </Box>
    );
}