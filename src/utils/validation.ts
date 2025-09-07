
export const validateNumber = (value: string, min = 0, max?: number): { isValid: boolean; error?: string } => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: "Harus berupa angka yang valid" };
  }
  
  if (num < min) {
    return { isValid: false, error: `Nilai minimal adalah ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, error: `Nilai maksimal adalah ${max}` };
  }
  
  return { isValid: true };
};

export const validateRequired = (value: string): { isValid: boolean; error?: string } => {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: "Field ini wajib diisi" };
  }
  
  return { isValid: true };
};

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Format email tidak valid" };
  }
  
  return { isValid: true };
};

export const validatePositiveInteger = (value: string): { isValid: boolean; error?: string } => {
  const num = parseInt(value);
  
  if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
    return { isValid: false, error: "Harus berupa bilangan bulat positif" };
  }
  
  return { isValid: true };
};

export const getErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  
  return 'Terjadi kesalahan yang tidak diketahui';
};
