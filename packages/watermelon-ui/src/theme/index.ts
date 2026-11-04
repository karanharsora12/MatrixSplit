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
  // Financial balance semantic tokens
  positive: string;
  positiveBg: string;
  positiveBorder: string;
  negative: string;
  negativeBg: string;
  negativeBorder: string;
  neutral: string;
  neutralBg: string;
  neutralBorder: string;
  // Status tokens
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
}

export const lightTheme: ColorTheme = {
  primary: '#10B981', // Emerald 500
  primaryHover: '#059669', // Emerald 600
  primaryLight: '#D1FAE5', // Emerald 100
  secondary: '#0F172A', // Deep navy slate 900
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A', // Slate 900
  textMuted: '#64748B', // Slate 500
  textInverse: '#FFFFFF',
  border: '#E2E8F0', // Slate 200
  divider: '#F1F5F9', // Slate 100
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
  secondary: '#38BDF8',
  background: '#0B0F19', // Deep navy black
  surface: '#151D2A',
  card: '#151D2A',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textInverse: '#0F172A',
  border: '#222F3E',
  divider: '#1E293B',
  positive: '#34D399',
  positiveBg: '#064E3B',
  positiveBorder: '#065F46',
  negative: '#F87171',
  negativeBg: '#450A0A',
  negativeBorder: '#7F1D1D',
  neutral: '#94A3B8',
  neutralBg: '#1E293B',
  neutralBorder: '#334155',
  warning: '#FBBF24',
  warningBg: '#78350F',
  info: '#60A5FA',
  infoBg: '#1E3A8A',
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.35,
    relaxed: 1.5,
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
  sm: 6,
  md: 10,
  base: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};
