// src/components/profitAnalysis/tabs/RincianTab/constants/colors.ts

export const STATUS_COLORS = {
  excellent: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700',
    icon: 'text-green-600'
  },
  good: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
    icon: 'text-blue-600'
  },
  fair: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    icon: 'text-yellow-600'
  },
  poor: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-700',
    icon: 'text-orange-600'
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    icon: 'text-red-600'
  }
} as const;

export const CARD_COLORS = {
  HPP: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-600',
    textDark: 'text-blue-800'
  },
  OPEX: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-600',
    textDark: 'text-orange-800'
  },
  MATERIAL: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-600',
    textDark: 'text-green-800'
  },
  LABOR: {
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    text: 'text-purple-600',
    textDark: 'text-purple-800'
  },
  OVERHEAD: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-500',
    text: 'text-indigo-600',
    textDark: 'text-indigo-800'
  }
} as const;

export const DATA_SOURCE_COLORS = {
  actual: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700'
  },
  mixed: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-700'
  },
  estimated: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-700'
  }
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;
export type CardColorKey = keyof typeof CARD_COLORS;