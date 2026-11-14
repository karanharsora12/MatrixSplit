import React, { createContext, useContext, useMemo } from 'react';
import { ColorTheme, lightTheme, darkTheme, typography, spacing, borderRadius, shadows } from './index';

interface ThemeContextValue {
  isDark: boolean;
  theme: ColorTheme;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  theme: lightTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
});

export const ThemeProvider: React.FC<{
  isDark?: boolean;
  children: React.ReactNode;
}> = ({ isDark = false, children }) => {
  const value = useMemo(
    () => ({
      isDark,
      theme: isDark ? darkTheme : lightTheme,
      typography,
      spacing,
      borderRadius,
      shadows,
    }),
    [isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const WatermelonThemeProvider = ThemeProvider;
export const useTheme = () => useContext(ThemeContext);
export const useWatermelonTheme = useTheme;
