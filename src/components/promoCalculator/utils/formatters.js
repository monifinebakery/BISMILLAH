export const formatters = {
  // Format currency (Indonesian Rupiah)
  currency: (value, options = {}) => {
    const defaultOptions = {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    };

    try {
      return new Intl.NumberFormat('id-ID', {
        ...defaultOptions,
        ...options
      }).format(value || 0);
    } catch (error) {
      return `Rp ${(value || 0).toLocaleString('id-ID')}`;
    }
  },

  // Format currency without symbol
  currencyValue: (value) => {
    try {
      return new Intl.NumberFormat('id-ID').format(value || 0);
    } catch (error) {
      return (value || 0).toString();
    }
  },

  // Format percentage
  percentage: (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return `${Number(value).toFixed(decimals)}%`;
  },

  // Format date (Indonesian format)
  date: (dateString, options = {}) => {
    if (!dateString) return '-';
    
    const defaultOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        ...defaultOptions,
        ...options
      });
    } catch (error) {
      return dateString;
    }
  },

  // Format date time
  dateTime: (dateString) => {
    if (!dateString) return '-';
    
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  },

  // Format relative time (contoh: "2 jam yang lalu")
  relativeTime: (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays < 7) return `${diffDays} hari yang lalu`;
      
      return formatters.date(dateString);
    } catch (error) {
      return formatters.date(dateString);
    }
  },

  // Format number with thousand separator
  number: (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    
    try {
      return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    } catch (error) {
      return value.toString();
    }
  },

  // Truncate text with ellipsis
  truncate: (text, maxLength = 50) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Format promo type
  promoType: (type) => {
    const types = {
      bogo: 'BOGO',
      discount: 'Diskon',
      bundle: 'Bundle'
    };
    return types[type] || type;
  },

  // Format status with proper capitalization
  status: (status) => {
    const statuses = {
      aktif: 'Aktif',
      nonaktif: 'Non-aktif',
      draft: 'Draft'
    };
    return statuses[status] || status;
  },

  // Format file size
  fileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format margin difference
  marginDiff: (current, original) => {
    if (!current || !original) return '0%';
    
    const diff = current - original;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${formatters.percentage(diff)}`;
  },

  // Format discount amount based on type
  discountAmount: (value, type) => {
    if (type === 'persentase') {
      return `${value}%`;
    }
    return formatters.currency(value);
  }
};