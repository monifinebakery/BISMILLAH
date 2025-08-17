import React from 'react';
import type { ProfitTrendChartProps } from '../ProfitTrendChart';

const LazyProfitTrendChart = React.lazy(() => import('../ProfitTrendChart'));

export default LazyProfitTrendChart as React.ComponentType<ProfitTrendChartProps>;

