import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { AppLayout } from "@/components/layout/app-layout"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { SkipToContent } from "@/components/ui/accessibility"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AssetWise - 本地投资复盘工作台",
  description: "用于记录交易、管理资产、制定计划、复盘决策和分析收益的本地桌面 MVP。",
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <ErrorBoundary>
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
