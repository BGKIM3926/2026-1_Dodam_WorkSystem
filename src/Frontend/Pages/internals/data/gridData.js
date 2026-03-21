import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';

import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

function getDaysInMonth(month, year) {
  const date = new Date(year, month, 0);
  const monthName = date.toLocaleDateString('en-US', {
    month: 'short',
  });
  const daysInMonth = date.getDate();
  const days = [];
  let i = 1;
  while (days.length < daysInMonth) {
    days.push(`${monthName} ${i}`);
    i += 1;
  }
  return days;
}

function renderSparklineCell(params) {
  const data = getDaysInMonth(4, 2024);
  const { value, colDef } = params;

  if (!value || value.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <SparkLineChart
        data={value}
        width={colDef.computedWidth || 100}
        height={32}
        plotType="bar"
        showHighlight
        showTooltip
        color="hsl(210, 98%, 42%)"
        xAxis={{
          scaleType: 'band',
          data,
        }}
      />
    </div>
  );
}

function renderStatus(status) {
  const colors = {
    Online: 'success',
    Offline: 'default',
  };

  return <Chip label={status} color={colors[status]} size="small" />;
}

export function renderAvatar(params) {
  if (params.value == null) {
    return '';
  }

  return (
    <Avatar
      sx={{
        backgroundColor: params.value.color,
        width: '24px',
        height: '24px',
        fontSize: '0.85rem',
      }}
    >
      {params.value.name.toUpperCase().substring(0, 1)}
    </Avatar>
  );
}

export const columns = [
  {
    field: 'customerName',
    headerName: '고객명',
    flex: 1,
  },
  { field: 'serviceName', headerName: '서비스명', flex: 1 },
  { field: 'serviceNameMin', headerName: '서비스약어', flex: 1 },
  { field: 'systemName', headerName: '시스템명', flex: 1 },
  { field: 'systemNameMin', headerName: '시스템약어', flex: 1 },
  { field: 'hardwareName', headerName: '하드웨어', flex: 1 },
  { field: 'hardwareInfo', headerName: '하드웨어 정보', flex: 1 },
  { field: 'osName', headerName: 'OS', flex: 1, },
  { field: 'osIp', headerName: 'IP', flex: 1 },
  { field: 'osInfo', headerName: 'OS 정보', flex: 1 },
];


