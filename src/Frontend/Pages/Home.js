import Typography from '@mui/material/Typography';

// 임의로 테스트 해본 것들
import CustomizedTreeView from './components/CustomizedTreeView';

import CustomDatePicker from './components/CustomDatePicker';
import Stack from '@mui/material/Stack';

export default function Home() {
    return (
        <>
            <Stack spacing={2} sx={{ width: '100%' }} alignItems="flex-start">
                <Typography component="h2" variant="h6">
                    홈
                </Typography>
                <CustomDatePicker />
            </Stack>

            <Stack sx={{ width: '100%' }}>
                <CustomizedTreeView />
            </Stack>
        </>



    );
}