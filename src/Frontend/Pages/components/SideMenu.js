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
          alt="Riley Carter"
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
        {/* <Box sx={{ overflow: 'auto', height: '100%' }}>
          <DynamicTreeMenu
            data={treeData}
            onSelect={(id) => setSelectedNode(id)}
          />
        </Box> */}
        <MenuContent
          treeData={treeData}
          setSelectedNode={setSelectedNode}
        />
        
      </Box>
      
    </Drawer>
  );
}
