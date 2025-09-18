// src/lib/shared/index.ts - SHARED UTILITIES & COMPONENTS INDEX
// Easy import dari semua shared utilities dan components

// ==================== FORMATTERS ====================
export * from './formatters';
export { default as Formatters } from './formatters';

// ==================== COMPONENTS ====================
export * from './components/FormattedDisplay';
export { default as FormattedDisplayComponents } from './components/FormattedDisplay';

// ==================== RE-EXPORTS WITH ALIAS ====================

// Commonly used formatters dengan alias pendek
export {
  formatCurrency as currency,
  formatCompactCurrency as compactCurrency,
  formatPercentage as percentage,
  formatDate as date,
  formatNumber as number
} from './formatters';

// Components dengan alias pendek
export {
  CurrencyDisplay as Currency,
  PercentageDisplay as Percentage,
  StatusBadge as Status,
  DateDisplay as DateText,
  TruncatedText as Text,
  StatCard as Card
} from './components/FormattedDisplay';

// ==================== GROUPED EXPORTS ====================

import * as formatters from './formatters';
import * as components from './components/FormattedDisplay';

export const SharedUtils = {
  formatters,
  components
};

export default SharedUtils;