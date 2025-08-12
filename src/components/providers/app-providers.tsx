'use client';

import { ThemeProvider } from './theme-provider';
import { I18nProvider } from './i18n-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
