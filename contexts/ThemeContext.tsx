// contexts/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: typeof lightColors | typeof darkColors;
}

const lightColors = {
  primary: '#fc350b',
  secondary: '#a0430a',
  tertiary: '#f89b7a',
  background: '#fef1e1',
  cardLight: '#ffffff',
  cardDark: '#fef1e1',
  text: '#a0430a',
  textSecondary: '#fc350b',
  textLight: '#fef1e1',
  border: '#fc350b20',
  shadow: '#a0430a',
  gradientStart: '#fc350b',
  gradientEnd: '#a0430a',
  overlay: 'rgba(0,0,0,0.5)',
  badgeBackground: '#fc350b15',
  modalBackground: '#ffffff',
  white: '#ffffff',
  black: '#1E293B',
  darkBg: '#faf5ee',
  darkCard: '#ece5d8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const darkColors: typeof lightColors = {
  primary: '#ff6b4a',
  secondary: '#d47a4a',
  tertiary: '#f8a07e',
  background: '#1a1a1a',
  cardLight: '#2d2d2d',
  cardDark: '#383838',
  text: '#e0e0e0',
  textSecondary: '#ff8a6a',
  textLight: '#f5f5f5',
  border: '#404040',
  shadow: '#000000',
  gradientStart: '#ff6b4a',
  gradientEnd: '#d47a4a',
  overlay: 'rgba(0,0,0,0.8)',
  badgeBackground: '#ff6b4a20',
  modalBackground: '#2d2d2d',
  white: '#2d2d2d',
  black: '#e0e0e0',
  darkBg: '#2d2d2d',
  darkCard: '#383838',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme as ThemeType);
      } else {
        setTheme(systemColorScheme as ThemeType || 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};