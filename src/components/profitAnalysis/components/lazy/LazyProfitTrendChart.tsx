import React from 'react';

const profitTrendChartImport = () => import('../ProfitTrendChart');
const LazyProfitTrendChart = React.lazy(profitTrendChartImport);

// Import types separately to avoid bundling
type ProfitTrendChartProps = React.ComponentProps<React.ComponentType<any>>;

export default LazyProfitTrendChart as React.ComponentType<ProfitTrendChartProps>;

