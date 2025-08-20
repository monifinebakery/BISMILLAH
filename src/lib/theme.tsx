import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

interface ThemeProviderProps {
  attribute?: string;
  defaultTheme?: Theme;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  attribute = "class",
  defaultTheme = "light",
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
    }
  }), [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (attribute === "class") {
      root.classList.toggle("dark", theme === "dark");
    } else {
      root.setAttribute(attribute, theme);
    }
    
    // Store theme in localStorage
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // Handle localStorage errors silently
      console.warn("Unable to save theme to localStorage", e);
    }
  }, [theme, attribute]);

  // Load theme from localStorage on initial render
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
        setTheme(savedTheme);
      }
    } catch (e) {
      // Handle localStorage errors silently
      console.warn("Unable to load theme from localStorage", e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);