import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SelectContent from './SelectContent';
import MenuContent from './MenuContent';
import OptionsMenu from './OptionsMenu';
import DynamicTreeMenu from './DynamicTreeMenu';
import { buildTree } from '../../Utils/buildTree';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';
import Button from '@mui/material/Button';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useNavigate } from 'react-router-dom';

import { useEffect, useState } from 'react';

const drawerWidth = 240;


const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

export default function SideMenu() {
  const [user, setUser] = useState({
    id: '',
    name: '',
    role: '',
  });

  const [treeData, setTreeData] = useState([]);
  const { setSelectedNode } = useSelectedNode();

  useEffect(() => {
    fetch('http://localhost:8080/api/dsystem')
      .then((res) => res.json())
      .then((data) => {
        const tree = buildTree(data);
        setTreeData(tree);
      });
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('loginUser');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('loginUser'); // 🔥 핵심
    navigate('/');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          sizes="small"
          alt={user.name}
          src="/static/images/avatar/7.jpg"
          sx={{ width: 36, height: 36 }}
        />
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {user.name}
          </Typography>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {user.role}
          </Typography>
        </Box>
        <OptionsMenu />
      </Stack>
      <Divider />
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MenuContent
          treeData={treeData}
          setSelectedNode={setSelectedNode}
        />
        
      </Box>


      <Stack sx={{ p: 2 }}>
        <Button variant="outlined" fullWidth startIcon={<LogoutRoundedIcon />} onClick={handleLogout}>
          로그아웃
        </Button>
      </Stack>
      
    </Drawer>
  );
}
