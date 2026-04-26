import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';
import { buildTree } from '../../Utils/buildTree';
import MenuContent from './MenuContent';

function SideMenuMobile({ open, toggleDrawer }) {
  const [user, setUser] = useState({
    id: '',
    name: '',
    role: '',
  });

  const [treeData, setTreeData] = useState([]);
  const { setSelectedNode } = useSelectedNode();
  const navigate = useNavigate();


  useEffect(() => {
    const fetchTreeData = async () => {
      try {
        const [systemsRes, legacyRes] = await Promise.all([
          fetch('/api/dsystem'),
          fetch('/api/legacy-service/ids'),
        ]);
        const [systems, legacyIds] = await Promise.all([
          systemsRes.json(),
          legacyRes.json(),
        ]);
        setTreeData(buildTree(systems, legacyIds));
      } catch (error) {
        console.error(error);
      }
    };

    fetchTreeData();
    window.addEventListener('legacy-services-updated', fetchTreeData);
    return () => window.removeEventListener('legacy-services-updated', fetchTreeData);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('loginUser');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('loginUser'); // 🔥 핵심
    navigate('/');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={toggleDrawer(false)}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        [`& .${drawerClasses.paper}`]: {
          backgroundImage: 'none',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Stack
        sx={{
          maxWidth: '70dvw',
          height: '100%',
        }}
      >
        <Stack direction="row" sx={{ p: 2, pb: 0, gap: 1 }}>
          <Stack
            direction="row"
            sx={{ gap: 1, alignItems: 'center', flexGrow: 1, p: 1 }}
          >
            <Avatar
              sizes="small"
              alt={user.name}
              src="/static/images/avatar/7.jpg"
              sx={{ width: 24, height: 24 }}
            />
            <Box sx={{ mr: 'auto' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.name}
              </Typography>

              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user.role}
              </Typography>
            </Box>
          </Stack>
        </Stack>
        <Divider />
        <Stack sx={{ flexGrow: 1 }}>
          <MenuContent
            treeData={treeData}
            setSelectedNode={setSelectedNode}
            mobileOnly
          />
          <Divider />
        </Stack>
        <Stack sx={{ p: 2 }}>
          <Button variant="outlined" fullWidth startIcon={<LogoutRoundedIcon />} onClick={handleLogout}>
            로그아웃
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}

SideMenuMobile.propTypes = {
  open: PropTypes.bool,
  toggleDrawer: PropTypes.func.isRequired,
};

export default SideMenuMobile;
