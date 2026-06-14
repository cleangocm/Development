'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, TranslationKey, Language } from '@/translations';
import { parseCookies } from 'nookies';
import api from '@/services/api';

type Theme = 'light' | 'dark' | 'system';
type Direction = 'ltr' | 'rtl';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  direction: Direction;
  setDirection: (direction: Direction) => void;
  language: string;
  setLanguage: (language: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  currencySymbol: string;
  formatPrice: (amountInUSD: number) => string;
  convertPrice: (amountInUSD: number) => number;
  t: (key: TranslationKey) => string;
}

// Currency code to symbol map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', BDT: '৳', INR: '₹', JPY: '¥', CNY: '¥',
  AUD: 'A$', CAD: 'C$', CHF: 'CHF', SAR: '﷼', AED: 'د.إ', MYR: 'RM',
  SGD: 'S$', PKR: '₨', TRY: '₺', KRW: '₩', THB: '฿', PHP: '₱',
  IDR: 'Rp', NGN: '₦', ZAR: 'R', BRL: 'R$', MXN: 'Mex$', EGP: 'E£',
};

// Static exchange rates (1 USD = X units of target currency)
// All prices in the database are stored in USD
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  BDT: 120,
  INR: 83.5,
  JPY: 149.5,
  CNY: 7.24,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  SAR: 3.75,
  AED: 3.67,
  MYR: 4.72,
  SGD: 1.34,
  PKR: 278,
  TRY: 32.5,
  KRW: 1320,
  THB: 35.8,
  PHP: 56.5,
  IDR: 15700,
  NGN: 1550,
  ZAR: 18.2,
  BRL: 4.97,
  MXN: 17.15,
  EGP: 30.9,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// RTL languages
const RTL_LANGUAGES = ['ar', 'he', 'ur', 'fa', 'ps'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isDark, setIsDark] = useState(false);
  const [direction, setDirectionState] = useState<Direction>('ltr');
  const [language, setLanguageState] = useState('en');
  const [currency, setCurrencyState] = useState('USD');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage and cookies
  useEffect(() => {
    const initializeSettings = () => {
      // Get saved theme
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
      }

      // Get language from Google Translate cookie
      const cookies = parseCookies();
      const googleTransCookie = cookies['googtrans'];
      let currentLang = 'en';
      
      if (googleTransCookie) {
        const parts = googleTransCookie.split('/');
        if (parts.length > 2) {
          currentLang = parts[2];
        }
      }
      
      setLanguageState(currentLang);
      
      // Set RTL direction for RTL languages
      if (RTL_LANGUAGES.includes(currentLang)) {
        setDirectionState('rtl');
        document.documentElement.dir = 'rtl';
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        setDirectionState('ltr');
        document.documentElement.dir = 'ltr';
        document.documentElement.setAttribute('dir', 'ltr');
      }
      
      setMounted(true);
    };

    initializeSettings();

    // Fetch admin-set currency from backend (always use server currency)
    const fetchServerCurrency = async () => {
      try {
        const res = await api.get('/public/site-settings');
        if (res.data.status === 'success' && res.data.data?.currency) {
          const serverCurrency = res.data.data.currency;
          setCurrencyState(serverCurrency);
          localStorage.removeItem('selectedCurrency');
        }
      } catch {
        // Silently use defaults
      }
    };
    fetchServerCurrency();
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (!mounted) return;

    const updateDarkMode = () => {
      let shouldBeDark = false;

      if (theme === 'dark') {
        shouldBeDark = true;
      } else if (theme === 'system') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(shouldBeDark);
      
      // Update document class
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateDarkMode();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateDarkMode();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // Handle direction changes
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dir = direction;
    document.documentElement.setAttribute('dir', direction);
  }, [direction, mounted]);

  const setTheme = (newTheme: Theme) => {
    // Add transition class for smooth animation
    document.documentElement.classList.add('theme-transitioning');
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 700);
  };

  const setDirection = (newDirection: Direction) => {
    setDirectionState(newDirection);
  };

  const setLanguage = async (newLanguage: string) => {
    setLanguageState(newLanguage);
    
    // Update direction based on language
    if (RTL_LANGUAGES.includes(newLanguage)) {
      setDirectionState('rtl');
      document.documentElement.dir = 'rtl';
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      setDirectionState('ltr');
      document.documentElement.dir = 'ltr';
      document.documentElement.setAttribute('dir', 'ltr');
    }
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  // Translation function
  const t = (key: TranslationKey): string => {
    const lang = language as Language;
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  // Currency conversion: convert USD amount to target currency
  const convertPrice = (amountInUSD: number): number => {
    const rate = EXCHANGE_RATES[currency] || 1;
    return amountInUSD * rate;
  };

  // Format price: convert USD to target currency and format with symbol
  const formatPrice = (amountInUSD: number): string => {
    const converted = convertPrice(amountInUSD);
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    // For currencies with large values (JPY, KRW, IDR, etc.), show no decimals
    const noDecimalCurrencies = ['JPY', 'KRW', 'IDR', 'NGN', 'PKR', 'BDT', 'INR', 'EGP'];
    if (noDecimalCurrencies.includes(currency)) {
      return `${symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      isDark, 
      direction, 
      setDirection,
      language,
      setLanguage,
      currency,
      setCurrency,
      currencySymbol: CURRENCY_SYMBOLS[currency] || '$',
      formatPrice,
      convertPrice,
      t
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
