// src/components/operational-costs/OperationalCostPage.tsx

import React from 'react';
import { OperationalCostProvider } from './context';
import { OperationalCostContent } from './features/OperationalCostContent';

const OperationalCostPage: React.FC = () => {
  return (
    <OperationalCostProvider>
      <OperationalCostContent />
    </OperationalCostProvider>
  );
};

export default OperationalCostPage;