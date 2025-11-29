import { DefaultTheme } from 'styled-components';

export const lightTheme: DefaultTheme = {
  name: 'light',
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',
    
    background: '#fafafa',
    surface: '#ffffff',
    surfaceHover: '#f8fafc',
    surfaceAlt: '#f8fafc',

    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    
    border: '#e2e8f0',
    borderHover: '#cbd5e1',
    
    success: '#10b981',
    successLight: '#d1fae5',
    
    error: '#ef4444',
    errorLight: '#fee2e2',
    
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    
    info: '#3b82f6',
    infoLight: '#dbeafe',
    
    purple: '#a855f7',
    purpleLight: '#f3e8ff',
    
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a',
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  fonts: {
    sans: "'Inter', sans-serif",
    serif: "'Merriweather', serif",
    mono: "'Roboto Mono', monospace",
    display: "'Playfair Display', serif",
  },
  
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  borderRadius: {
    sm: '0.375rem',
    base: '0.5rem',
    md: '0.625rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  transitions: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },
};

export const darkTheme: DefaultTheme = {
  ...lightTheme,
  name: 'dark',
  colors: {
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    primaryLight: '#1e40af',
    
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    surfaceAlt: '#334155',

    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    
    border: '#334155',
    borderHover: '#475569',
    
    success: '#22c55e',
    successLight: '#064e3b',
    
    error: '#f87171',
    errorLight: '#7f1d1d',
    
    warning: '#fbbf24',
    warningLight: '#78350f',
    
    info: '#60a5fa',
    infoLight: '#1e3a8a',
    
    purple: '#c084fc',
    purpleLight: '#581c87',
    
    brand: {
      50: '#1e3a8a',
      100: '#1e40af',
      500: '#3b82f6',
      600: '#60a5fa',
      700: '#93c5fd',
      900: '#dbeafe',
    },
  },
};

// Extend styled-components DefaultTheme
declare module 'styled-components' {
  export interface DefaultTheme {
    name: 'light' | 'dark';
    colors: {
      primary: string;
      primaryHover: string;
      primaryLight: string;
      background: string;
      surface: string;
      surfaceHover: string;
      surfaceAlt: string;
      text: string;
      textSecondary: string;
      textTertiary: string;
      border: string;
      borderHover: string;
      success: string;
      successLight: string;
      error: string;
      errorLight: string;
      warning: string;
      warningLight: string;
      info: string;
      infoLight: string;
      purple: string;
      purpleLight: string;
      brand: {
        50: string;
        100: string;
        500: string;
        600: string;
        700: string;
        900: string;
      };
    };
    shadows: {
      sm: string;
      base: string;
      md: string;
      lg: string;
      xl: string;
    };
    fonts: {
      sans: string;
      serif: string;
      mono: string;
      display: string;
    };
    fontSizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    borderRadius: {
      sm: string;
      base: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };
    transitions: {
      fast: string;
      base: string;
      slow: string;
    };
  }
}
