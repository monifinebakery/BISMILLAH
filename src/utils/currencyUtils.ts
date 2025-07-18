// src/utils/currencyUtils.ts

/**
 * Formats a number as Indonesian Rupiah currency.
 * @param value The number to format.
 * @returns A string formatted as "Rp X.XXX.XXX".
 */
export const formatCurrency = (value: number): string => {
  if (isNaN(value) || value === null) {
    return 'Rp 0'; // Handle invalid or null input
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a large number into an abbreviated string (e.g., "100K", "1.2M", "5B") with "Rp" prefix.
 * Useful for chart axis labels or condensed displays.
 * @param num The number to format.
 * @param digits The number of decimal places to use for abbreviated numbers. Defaults to 1.
 * @returns A formatted string (e.g., "Rp 100K", "Rp 1.2M").
 */
export const formatLargeNumber = (num: number, digits: number = 1): string => {
  if (isNaN(num) || num === null) {
    return 'Rp 0'; // Handle invalid or null input
  }

  const si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: "K" },
    { value: 1E6, symbol: "M" },
    { value: 1E9, symbol: "B" },
    { value: 1E12, symbol: "T" }, // Trillions
    { value: 1E15, symbol: "Q" }  // Quadrillions
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/; // Regex to remove trailing zeros after decimal point
  let i;

  // Find the appropriate abbreviation scale
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }

  // For numbers less than 1000, use regular formatCurrency
  if (i === 0) {
      return formatCurrency(num);
  }

  // Calculate the abbreviated number and format it
  let abbreviatedNum = (num / si[i].value).toFixed(digits); // Get the number part with specified digits
  abbreviatedNum = abbreviatedNum.replace(rx, "$1"); // Remove unnecessary trailing zeros

  // Format the number part with id-ID locale for proper comma/decimal separator
  const numberPart = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
  }).format(parseFloat(abbreviatedNum)); // Parse to float to ensure correct formatting

  return `Rp ${numberPart}${si[i].symbol}`;
};