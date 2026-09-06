import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getThemeById, themeToCss, isLightColor, type Theme } from './themes';
import { useAuth } from './auth';

type ThemeContextValue = {
  theme: Theme | undefined;
  isDark: boolean;
  textColor: string;
  subtextColor: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  rawBg: string;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  navBg: string;
  navBorder: string;
  navInactive: string;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const LIGHT: ThemeContextValue = {
  theme: undefined,
  isDark: false,
  textColor: '#0f172a',
  subtextColor: '#64748b',
  cardBg: '#ffffff',
  cardBorder: '#f1f5f9',
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  rawBg: '#f8fafc',
  reduceMotion: false,
  setReduceMotion: () => {},
  navBg: 'rgba(255, 255, 255, 0.9)',
  navBorder: '#f1f5f9',
  navInactive: '#94a3b8',
};

const DARK: ThemeContextValue = {
  theme: undefined,
  isDark: true,
  textColor: '#f1f5f9',
  subtextColor: '#94a3b8',
  cardBg: '#1e293b',
  cardBorder: '#334155',
  inputBg: '#1e293b',
  inputBorder: '#475569',
  rawBg: '#0f172a',
  reduceMotion: false,
  setReduceMotion: () => {},
  navBg: 'rgba(15, 23, 42, 0.9)',
  navBorder: 'rgba(51, 65, 85, 0.5)',
  navInactive: '#94a3b8',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [theme, setTheme] = useState<Theme | undefined>(undefined);
  const [reduceMotion, setReduceMotion] = useState(() => {
    return localStorage.getItem('reduce-motion') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('reduce-motion', String(reduceMotion));
  }, [reduceMotion]);

  useEffect(() => {
    if (profile?.theme_id) {
      const t = getThemeById(profile.theme_id);
      setTheme(t);
    } else {
      setTheme(undefined);
    }
  }, [profile?.theme_id]);

  const isDark = theme?.isDark ?? false;

  let value: ThemeContextValue;
  const navColors = isDark
    ? { navBg: 'rgba(15, 23, 42, 0.9)', navBorder: 'rgba(51, 65, 85, 0.5)', navInactive: '#94a3b8' }
    : { navBg: 'rgba(255, 255, 255, 0.9)', navBorder: '#f1f5f9', navInactive: '#94a3b8' };
  if (!theme) {
    value = { ...LIGHT, reduceMotion, setReduceMotion, ...navColors };
  } else if (theme.isDark) {
    value = {
      theme,
      isDark: true,
      textColor: '#f1f5f9',
      subtextColor: '#94a3b8',
      cardBg: 'rgba(30, 41, 59, 0.85)',
      cardBorder: 'rgba(51, 65, 85, 0.5)',
      inputBg: 'rgba(30, 41, 59, 0.8)',
      inputBorder: 'rgba(71, 85, 105, 0.6)',
      rawBg: themeToCss(theme),
      reduceMotion,
      setReduceMotion,
      ...navColors,
    };
  } else {
    const lightBg = isLightColor(theme.colors[0]);
    value = {
      theme,
      isDark: false,
      textColor: lightBg ? '#0f172a' : '#1e293b',
      subtextColor: lightBg ? '#64748b' : '#475569',
      cardBg: 'rgba(255, 255, 255, 0.9)',
      cardBorder: 'rgba(241, 245, 249, 0.8)',
      inputBg: 'rgba(255, 255, 255, 0.9)',
      inputBorder: 'rgba(226, 232, 240, 0.8)',
      rawBg: themeToCss(theme),
      reduceMotion,
      setReduceMotion,
      ...navColors,
    };
  }

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={reduceMotion ? 'reduce-motion' : ''}
        style={{
          background: value.rawBg,
          color: value.textColor,
          minHeight: '100vh',
          ['--nav-bg' as string]: value.navBg,
          ['--nav-border' as string]: value.navBorder,
          ['--nav-inactive' as string]: value.navInactive,
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
