import { Stack, Card, CardContent, Typography } from '@mui/material';

export default function HistoryList({ rows }) {
    return (
        <Stack spacing={2}>
            {rows.map((row) => (
                <Card key={row.historyId}> {/* 🔥 key 수정 */}
                    <CardContent>

                        {/* 작업 유형 */}
                        <Typography variant="subtitle1" fontWeight={600}>
                            {row.workType}
                        </Typography>

                        {/* 내용 */}
                        <Typography variant="body2" color="text.secondary">
                            {row.issue}
                        </Typography>

                        {/* 담당자 */}
                        <Typography variant="caption">
                            👤 {row.workerId}
                        </Typography>

                        {/* 장비 */}
                        <Typography variant="caption" sx={{ ml: 2 }}>
                            🖥 {row.equipment}
                        </Typography>

                    </CardContent>
                </Card>
            ))}
        </Stack>
    );
}