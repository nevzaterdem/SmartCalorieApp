import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

import tr from '../locales/tr';
import en from '../locales/en';

// i18n instance oluştur
const i18n = new I18n({
    tr,
    en,
});

// Varsayılan dil ayarları
i18n.defaultLocale = 'tr';
i18n.enableFallback = true;

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => Promise<void>;
    t: (key: string, options?: object) => string;
    availableLanguages: { code: string; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'app_language';

const availableLanguages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<string>('tr');
    const [isLoaded, setIsLoaded] = useState(false);

    // Dil yükle
    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (savedLanguage) {
                i18n.locale = savedLanguage;
                setLanguageState(savedLanguage);
            } else {
                // Cihazın dilini kullan
                const deviceLocale = Localization.getLocales()[0]?.languageCode || 'tr';
                const supportedLang = availableLanguages.find(l => l.code === deviceLocale);
                const defaultLang = supportedLang ? deviceLocale : 'tr';
                i18n.locale = defaultLang;
                setLanguageState(defaultLang);
            }
        } catch (e) {
            console.log('Language load error:', e);
            i18n.locale = 'tr';
        } finally {
            setIsLoaded(true);
        }
    };

    const setLanguage = async (lang: string) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, lang);
            i18n.locale = lang;
            setLanguageState(lang);
        } catch (e) {
            console.log('Language save error:', e);
        }
    };

    // Çeviri fonksiyonu
    const t = (key: string, options?: object): string => {
        return i18n.t(key, options);
    };

    if (!isLoaded) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export { i18n };
