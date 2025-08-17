import React from 'react';
import type { DetailedBreakdownTableProps } from '../DetailedBreakdownTable';

const LazyDetailedBreakdownTable = React.lazy(() => import('../DetailedBreakdownTable'));

export default LazyDetailedBreakdownTable as React.ComponentType<DetailedBreakdownTableProps>;

