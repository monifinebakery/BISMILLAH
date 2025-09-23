// src/utils/followupValidation.ts
export const canFollowupOrder = (orderStatus: string, orderAgeMinutes: number): boolean => {
  const eligibleStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
  const maxAgeMinutes = 1440; // 24 hours

  return eligibleStatuses.includes(orderStatus) && orderAgeMinutes <= maxAgeMinutes;
};

export const getFollowupUrgency = (orderStatus: string): 'high' | 'medium' | 'low' => {
  switch (orderStatus) {
    case 'pending':
      return 'high'; // Payment confirmation needed
    case 'confirmed':
    case 'preparing':
    case 'ready':
      return 'medium'; // Progress updates
    case 'delivered':
      return 'low'; // Optional feedback
    default:
      return 'low';
  }
};

export const getFollowupRecommendation = (orderStatus: string, orderAgeMinutes: number) => {
  if (!canFollowupOrder(orderStatus, orderAgeMinutes)) {
    let reason = 'Status tidak memerlukan followup manual';
    if (orderStatus === 'cancelled') reason = 'Order sudah dibatalkan';
    if (orderStatus === 'completed') reason = 'Order sudah selesai dengan baik';
    if (orderAgeMinutes > 1440) reason = 'Order sudah terlalu lama';

    return {
      canFollowup: false,
      reason,
      urgency: 'none' as const,
      recommendation: undefined,
      suggestedDelay: undefined
    };
  }

  const urgency = getFollowupUrgency(orderStatus);
  let recommendation = 'Waktu yang tepat untuk followup';

  // Time-based recommendations
  if (orderAgeMinutes < 5 && orderStatus === 'pending') {
    recommendation = 'Tunggu sebentar, order masih sangat baru';
  } else if (orderAgeMinutes > 60 && ['confirmed', 'preparing'].includes(orderStatus)) {
    recommendation = 'Order sudah cukup lama, sebaiknya segera followup';
  } else if (orderStatus === 'ready' && orderAgeMinutes > 15) {
    recommendation = 'Pesanan sudah lama siap, pelanggan mungkin menunggu';
  }

  return {
    canFollowup: true,
    urgency,
    recommendation,
    suggestedDelay: getSuggestedDelay(orderStatus, orderAgeMinutes)
  };
};

const getSuggestedDelay = (status: string, ageMinutes: number): number => {
  // Return suggested delay in minutes before showing followup option
  switch (status) {
    case 'pending': return Math.max(0, 2 - ageMinutes); // 2 minutes
    case 'confirmed': return Math.max(0, 15 - ageMinutes); // 15 minutes
    case 'preparing': return Math.max(0, 30 - ageMinutes); // 30 minutes
    case 'ready': return Math.max(0, 10 - ageMinutes); // 10 minutes
    case 'delivered': return Math.max(0, 60 - ageMinutes); // 1 hour
    default: return 0;
  }
};

export const getStatusIndicator = (status: string) => {
  const indicators: Record<string, { color: string; icon: string; text: string; bgColor: string; borderColor: string }> = {
    pending: { color: 'red', icon: '⚠️', text: 'Perlu Konfirmasi', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    confirmed: { color: 'yellow', icon: '⏳', text: 'Dalam Persiapan', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    preparing: { color: 'blue', icon: '👨‍🍳', text: 'Sedang Dimasak', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    ready: { color: 'green', icon: '✅', text: 'Siap Diambil', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    delivered: { color: 'gray', icon: '📦', text: 'Sudah Diterima', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
    cancelled: { color: 'red', icon: '❌', text: 'Dibatalkan', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    completed: { color: 'green', icon: '🎉', text: 'Selesai', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
  };

  return indicators[status] || { color: 'gray', icon: '❓', text: 'Unknown', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
};
