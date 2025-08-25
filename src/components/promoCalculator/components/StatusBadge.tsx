import React from 'react';
import { helpers } from '../utils';

const StatusBadge = ({ status, className = '' }: any) => {
  const statusConfig = helpers.getStatusColor(status);
  
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border
      ${className}
    `}>
      {helpers.formatters?.status ? helpers.formatters.status(status) : status}
    </span>
  );
};

export default StatusBadge;