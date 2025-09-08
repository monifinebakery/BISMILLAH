import React from 'react';

const detailedBreakdownTableImport = () => import('../DetailedBreakdownTable');
const LazyDetailedBreakdownTable = React.lazy(detailedBreakdownTableImport);

// Import types separately to avoid bundling
type DetailedBreakdownTableProps = React.ComponentProps<React.ComponentType<any>>;

export default LazyDetailedBreakdownTable as React.ComponentType<DetailedBreakdownTableProps>;

