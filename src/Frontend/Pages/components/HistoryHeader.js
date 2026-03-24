import { Typography, Box } from '@mui/material';

export default function HistoryHeader({ selectedNode, rows }) {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h6">
                {selectedNode
                    ? `${selectedNode.region} / ${selectedNode.systemName}`
                    : '유지보수 이력'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
                총 {rows.length}건
            </Typography>
        </Box>
    );
}