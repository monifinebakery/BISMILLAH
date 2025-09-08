import React from 'react';

const profitBreakdownChartImport = () => import('../ProfitBreakdownChart');
const LazyProfitBreakdownChart = React.lazy(profitBreakdownChartImport);

// Import types separately to avoid bundling
type ProfitBreakdownChartProps = React.ComponentProps<React.ComponentType<any>>;

export default LazyProfitBreakdownChart as React.ComponentType<ProfitBreakdownChartProps>;

