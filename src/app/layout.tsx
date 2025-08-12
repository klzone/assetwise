import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { SkipToContent } from '@/components/ui/accessibility'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AssetWise - 智能资产管理平台',
  description: '现代化的资产管理和投资分析平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <SkipToContent />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <AppLayout>
              <main id="main-content" className="focus:outline-none" tabIndex={-1}>
                {children}
              </main>
            </AppLayout>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
