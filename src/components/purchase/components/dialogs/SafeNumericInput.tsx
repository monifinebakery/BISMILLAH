// src/components/purchase/components/dialogs/SafeNumericInput.tsx
// Safe numeric input component with guards

import React from 'react';

// Helper function to convert string to number
const toNumber = (v: string | number | '' | undefined | null): number => {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  
  let s = v.toString().trim().replace(/\s+/g, '');
  s = s.replace(/[^\d,.-]/g, '');
  
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/,/g, '.');
  }
  
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// Guards to prevent weird input
const makeBeforeInputGuard = (getValue: () => string, allowDecimal = true) =>
  (e: React.FormEvent<HTMLInputElement> & { nativeEvent: InputEvent }) => {
    const ch = (e.nativeEvent as { data?: string }).data ?? '';
    if (!ch) return;
    const el = e.currentTarget as HTMLInputElement;
    const cur = getValue() ?? '';
    const next =
      cur.substring(0, el.selectionStart ?? cur.length) +
      ch +
      cur.substring(el.selectionEnd ?? cur.length);

    const pattern = allowDecimal ? /^\d*(?:[.,]\d{0,6})?$/ : /^\d*$/;
    if (!pattern.test(next)) {
      e.preventDefault();
    }
  };

const handlePasteGuard = (allowDecimal = true) => (e: React.ClipboardEvent<HTMLInputElement>) => {
  const text = e.clipboardData.getData('text').trim();
  const ok = allowDecimal 
    ? /^\d*(?:[.,]\d{0,6})?$/.test(text) 
    : /^\d*$/.test(text);
    
  if (!ok) {
    e.preventDefault();
    return false;
  }
};

export interface SafeNumericInputProps 
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number;
  onBeforeInput?: (e: React.FormEvent<HTMLInputElement> & { nativeEvent: InputEvent }) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SafeNumericInput = React.forwardRef<
  HTMLInputElement,
  SafeNumericInputProps
>(({ className = '', value, onChange, ...props }, ref) => {
  const baseClasses =
    'flex h-10 w-full rounded-md border border-gray-500 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50';
    
  return (
    <input
      ref={ref}
      className={`${baseClasses} ${className}`}
      value={value}
      onChange={onChange}
      onBeforeInput={makeBeforeInputGuard(() => String(value))}
      onPaste={handlePasteGuard()}
      {...props}
    />
  );
});

SafeNumericInput.displayName = 'SafeNumericInput';