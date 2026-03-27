import React from 'react';

export interface ReportWebVitalsMetric {
  name: string;
  value: number;
  label: string;
  navigationType?: string;
  delta?: number;
  id?: string;
  entries?: PerformanceEntry[];
}

const reportWebVitals = (onPerfEntry?: (metric: ReportWebVitalsMetric) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
