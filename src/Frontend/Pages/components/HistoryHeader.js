import { Typography, Box } from '@mui/material';

export default function HistoryHeader({ selectedNode, rows }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2, mt: 4 }}>
            <Typography variant="h2" gutterBottom>
                {selectedNode
                    ? `${selectedNode.region} / ${selectedNode.systemName}`
                    : '이력 관리'}
            </Typography>

            <Typography variant="h4" color="text.secondary">
                총 {rows.length}건
            </Typography>
        </Box>
    );
}