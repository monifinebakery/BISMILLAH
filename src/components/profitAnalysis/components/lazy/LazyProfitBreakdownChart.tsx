import React from 'react';
import type { ProfitBreakdownChartProps } from '../ProfitBreakdownChart';

const LazyProfitBreakdownChart = React.lazy(() => import('../ProfitBreakdownChart'));

export default LazyProfitBreakdownChart as React.ComponentType<ProfitBreakdownChartProps>;

