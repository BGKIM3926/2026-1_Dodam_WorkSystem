import { useState } from 'react';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';

import DynamicTreeMenu from './DynamicTreeMenu';

import { useLocation, useNavigate } from 'react-router-dom';
import { useSelectedNode } from '../../Contexts/SelectedNodeContext';

export default function MenuContent({ treeData, mobileOnly = false }) {
  const { selectedNode, setSelectedNode } = useSelectedNode();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  return (
    <List>
      <ListItemButton
        selected={location.pathname.includes('home')}
        onClick={() => navigate('/dashboard/home')}
        sx={{
          borderRadius: 2,
          px: 2,
          py: 1.2,
          gap: 1.5,
          '& .MuiListItemIcon-root': {
            minWidth: 0,
            color: 'text.secondary',
          },
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'white',
            '& .MuiListItemIcon-root': {
              color: 'white',
            },
          },
        }}
      >
        <ListItemIcon>
          <HomeRoundedIcon />
        </ListItemIcon>
        <ListItemText primary="홈" />
      </ListItemButton>

      {!mobileOnly && (
        <ListItemButton
          selected={location.pathname.includes('users')}
          onClick={() => navigate('/dashboard/users')}
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1.2,
            gap: 1.5,
            '& .MuiListItemIcon-root': {
              minWidth: 0,
              color: 'text.secondary',
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white',
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
          }}
        >
          <ListItemIcon>
            <PeopleRoundedIcon />
          </ListItemIcon>
          <ListItemText primary="인사 관리" />
        </ListItemButton>
      )}

      <ListItemButton
        selected={location.pathname.includes('task')}
        onClick={() => navigate('/dashboard/task')}
        sx={{
          borderRadius: 2,
          px: 2,
          py: 1.2,
          gap: 1.5,
          '& .MuiListItemIcon-root': {
            minWidth: 0,
            color: 'text.secondary',
          },
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'white',
            '& .MuiListItemIcon-root': {
              color: 'white',
            },
          },
        }}
      >
        <ListItemIcon>
          <AssignmentRoundedIcon />
        </ListItemIcon>
        <ListItemText primary="고객 정보" />
      </ListItemButton>

      {!mobileOnly && (
        <ListItemButton
          selected={location.pathname.includes('settings')}
          onClick={() => navigate('/dashboard/settings')}
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1.2,
            gap: 1.5,
            '& .MuiListItemIcon-root': {
              minWidth: 0,
              color: 'text.secondary',
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white',
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
          }}
        >
          <ListItemIcon>
            <SettingsRoundedIcon />
          </ListItemIcon>
          <ListItemText primary="설정" />
        </ListItemButton>
      )}

      <Box
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
          <ListItemButton
            selected={location.pathname.includes('workhistory')}
            onClick={() => {
              setOpen((prev) => !prev);
            }}
            sx={{
              borderRadius: 2,
              px: 2,
              py: 1.2,
              gap: 1.5,
              '& .MuiListItemIcon-root': {
                minWidth: 0,
                color: 'text.secondary',
              },
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon>
              <WorkRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="이력 관리" />
          </ListItemButton>

          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 3 }}>
              <DynamicTreeMenu
                data={treeData}
                onSelect={(node) => {
                  setSelectedNode({
                    serviceName: node.serviceName,
                    customerName: node.customerName,
                    serviceId: node.serviceId,
                    isLegacy: !!node.isLegacy,
                  });

                  navigate(`/dashboard/workhistory?customerName=${node.customerName}&serviceName=${node.serviceName}`);
                }}
                selectedNode={selectedNode}
              />
            </Box>
          </Collapse>
        </Box>
    </List>
  );
}
