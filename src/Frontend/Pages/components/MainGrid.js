import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Copyright from '../internals/components/Copyright';

import CustomizedDataGrid from './CustomizedDataGrid';


export default function MainGrid() {
  return (
    <Container
      maxWidth={false}
      component="main"
      disableGutters
      sx={{ display: 'flex', flexDirection: 'column', px: { xs: 2, sm: 3, md: 4 } }}>
      {/* cards */}
      
      <Typography component="h2" variant="h2" sx={{ mb: 2, mt: 4 }}>
        고객 정보
      </Typography>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12 }}>
          <CustomizedDataGrid />
        </Grid>
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Container>
  );
}
