export interface ColorTheme {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  divider: string;
  positive: string;
  positiveBg: string;
  positiveBorder: string;
  negative: string;
  negativeBg: string;
  negativeBorder: string;
  neutral: string;
  neutralBg: string;
  neutralBorder: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
}

export const lightTheme: ColorTheme = {
  primary: '#10B981', // Emerald 500
  primaryHover: '#059669',
  primaryLight: '#D1FAE5',
  secondary: '#0F172A',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  positive: '#10B981',
  positiveBg: '#ECFDF5',
  positiveBorder: '#A7F3D0',
  negative: '#EF4444',
  negativeBg: '#FEF2F2',
  negativeBorder: '#FECACA',
  neutral: '#64748B',
  neutralBg: '#F1F5F9',
  neutralBorder: '#CBD5E1',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
};

export const darkTheme: ColorTheme = {
  primary: '#10B981',
  primaryHover: '#34D399',
  primaryLight: '#064E3B',
  secondary: '#F8FAFC',
  background: '#090D16',
  surface: '#111827',
  card: '#161F30',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textInverse: '#0F172A',
  border: '#1E293B',
  divider: '#1E293B',
  positive: '#10B981',
  positiveBg: '#022C22',
  positiveBorder: '#065F46',
  negative: '#EF4444',
  negativeBg: '#450A0A',
  negativeBorder: '#991B1B',
  neutral: '#94A3B8',
  neutralBg: '#1E293B',
  neutralBorder: '#334155',
  warning: '#F59E0B',
  warningBg: '#451A03',
  info: '#3B82F6',
  infoBg: '#172554',
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
};

export * from './ThemeContext';
