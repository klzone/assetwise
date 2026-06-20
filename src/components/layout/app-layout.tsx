import type { ReactNode } from "react"
import { ModernHeader } from "./modern-header"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: ReactNode
  className?: string
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModernHeader />
      <main id="main-content" className={cn("min-h-[calc(100vh-4rem)]", className)} tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
