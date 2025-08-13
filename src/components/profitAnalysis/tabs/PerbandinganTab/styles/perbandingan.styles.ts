// src/components/profitAnalysis/tabs/PerbandinganTab/styles/perbandingan.styles.ts

export const perbandinganStyles = {
  // Card variants
  card: {
    default: "bg-white shadow-sm border rounded-lg",
    highlighted: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200"
  },
  
  // Progress bar variants
  progress: {
    success: "bg-green-500",
    warning: "bg-yellow-500", 
    danger: "bg-red-500",
    info: "bg-blue-500"
  },

  // Status indicators
  status: {
    excellent: "text-green-600 bg-green-100",
    good: "text-blue-600 bg-blue-100", 
    fair: "text-yellow-600 bg-yellow-100",
    poor: "text-orange-600 bg-orange-100",
    critical: "text-red-600 bg-red-100"
  },

  // Mobile responsive classes
  mobile: {
    padding: "p-3",
    text: "text-xs",
    title: "text-sm",
    icon: "h-3 w-3"
  },

  desktop: {
    padding: "p-6", 
    text: "text-sm",
    title: "text-base",
    icon: "h-4 w-4"
  }
};