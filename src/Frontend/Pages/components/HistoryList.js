import { Grid, Card, CardContent, Typography } from '@mui/material';

export default function HistoryList({ rows }) {
    return (
        <Grid container spacing={4} columns={16}>
            {rows.map((row) => (
                <Grid item size={8} key={row.historyId}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>

                            <Typography variant="subtitle1" fontWeight={600}>
                                {row.workType}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                {row.issue}
                            </Typography>

                            <Typography variant="caption">
                                👤 {row.workerName}
                            </Typography>

                            <Typography variant="caption" sx={{ ml: 2 }}>
                                🖥 {row.equipment}
                            </Typography>

                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
}