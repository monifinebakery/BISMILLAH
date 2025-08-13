// src/components/profitAnalysis/tabs/rincianTab/constants/colors.ts

export const STATUS_COLORS = {
  GREEN: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-600', 
    textDark: 'text-green-800',
    icon: 'text-green-600'
  },
  BLUE: {
    bg: 'bg-blue-50',
    border: 'border-blue-500', 
    text: 'text-blue-600',
    textDark: 'text-blue-800',
    icon: 'text-blue-600'
  },
  RED: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-600',
    textDark: 'text-red-800', 
    icon: 'text-red-600'
  },
  YELLOW: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-600',
    textDark: 'text-yellow-800',
    icon: 'text-yellow-600'
  },
  ORANGE: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-600', 
    textDark: 'text-orange-800',
    icon: 'text-orange-600'
  },
  PURPLE: {
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    text: 'text-purple-600',
    textDark: 'text-purple-800',
    icon: 'text-purple-600'
  },
  GRAY: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-600',
    textDark: 'text-gray-800',
    icon: 'text-gray-600'
  }
} as const;

export const CARD_COLORS = {
  HPP: STATUS_COLORS.RED,
  OPEX: STATUS_COLORS.PURPLE,
  MATERIAL: STATUS_COLORS.BLUE,
  LABOR: STATUS_COLORS.ORANGE,
  ANALYSIS: STATUS_COLORS.GREEN,
  WARNING: STATUS_COLORS.YELLOW,
  INFO: STATUS_COLORS.BLUE,
  SUCCESS: STATUS_COLORS.GREEN,
  ERROR: STATUS_COLORS.RED
} as const;

export const DATA_SOURCE_COLORS = {
  actual: STATUS_COLORS.GREEN,
  mixed: STATUS_COLORS.YELLOW,
  estimated: STATUS_COLORS.ORANGE
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;
export type CardColorKey = keyof typeof CARD_COLORS;