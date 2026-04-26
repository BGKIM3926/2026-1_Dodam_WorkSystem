import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SelectedNodeProvider } from '../Contexts/SelectedNodeContext';
import AppNavbar from './components/AppNavbar';
import SideMenu from './components/SideMenu';
import AppTheme from './shared-theme/AppTheme';
import {
    chartsCustomizations,
    dataGridCustomizations,
    datePickersCustomizations,
    treeViewCustomizations,
} from './theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Dashboard(props) {
  const navigate = useNavigate();

  useEffect(() => {
      const user = localStorage.getItem('loginUser');
      
      if (!user) {
          navigate('/');
      }
  }, []);

  return (
    <SelectedNodeProvider>
      <AppTheme {...props} themeComponents={xThemeComponents}>
        <CssBaseline enableColorScheme />
        <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
          <SideMenu />
          <AppNavbar />
          {/* Main content */}
          <Box
            component="main"
            sx={(theme) => ({
              flexGrow: 1,
              backgroundColor: theme.vars
                ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                : alpha(theme.palette.background.default, 1),
              minWidth: 0,
              height: '100dvh',
              overflow: 'auto',
              overflowX: 'hidden',
            })}
          >
            <Stack
              spacing={2}
              sx={{
                alignItems: 'center',
                width: '100%',
                minWidth: 0,
                px: { xs: 1.5, sm: 2.5, md: 3 },
                pb: { xs: 3, md: 5 },
                mt: { xs: 8, md: 0 },
              }}
            >
              {/* <Header /> */}
              <Outlet />
            </Stack>
          </Box>
        </Box>
      </AppTheme>
    </SelectedNodeProvider>
  );
}
