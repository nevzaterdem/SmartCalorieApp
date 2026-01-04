import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    colors: typeof lightColors;
}

const lightColors = {
    background: '#f3f4f6',
    card: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    primary: '#10b981',
    primaryLight: '#ecfdf5',
    inputBg: '#f9fafb',
};

const darkColors = {
    background: '#111827',
    card: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    border: '#374151',
    primary: '#10b981',
    primaryLight: '#064e3b',
    inputBg: '#374151',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const saved = await AsyncStorage.getItem('darkMode');
            if (saved !== null) {
                setIsDarkMode(saved === 'true');
            }
        } catch (e) {
            console.log('Theme load error', e);
        }
    };

    const toggleDarkMode = async () => {
        const newValue = !isDarkMode;
        setIsDarkMode(newValue);
        try {
            await AsyncStorage.setItem('darkMode', newValue.toString());
        } catch (e) {
            console.log('Theme save error', e);
        }
    };

    const colors = isDarkMode ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}

export { lightColors, darkColors };
