import React, { useState } from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';

import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';

import DynamicTreeMenu from './DynamicTreeMenu';

import { useNavigate, useLocation } from 'react-router-dom';



export default function MenuContent({ treeData, setSelectedNode }) {
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

      {/* 🔥 이력 관리 + 트리 */}
      <ListItemButton
        selected={location.pathname.includes('workhistory')}
        onClick={() => {
          navigate('/dashboard/workhistory');
          setOpen((prev) => !prev); // 펼침/닫힘
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

      {/* 🔥 트리 (애니메이션 포함) */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 3 }}>
          <DynamicTreeMenu
            data={treeData}
            onSelect={(id) => setSelectedNode(id)}
          />
        </Box>
      </Collapse>
    </List>
  );
}
