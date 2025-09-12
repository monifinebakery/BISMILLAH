// Temporary theme provider to fix import errors
import React, { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return React.createElement(React.Fragment, null, children);
};

export default ThemeProvider;