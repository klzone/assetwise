import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  text?: string
  variant?: "default" | "overlay"
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = "md", text, variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6", 
      lg: "h-8 w-8"
    }

    const containerClasses = {
      default: "flex items-center justify-center",
      overlay: "fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
    }

    return (
      <div
        ref={ref}
        className={cn(containerClasses[variant], className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
          {text && (
            <p className="text-sm text-muted-foreground">{text}</p>
          )}
        </div>
      </div>
    )
  }
)
Loading.displayName = "Loading"

// 页面级别的加载组件
const PageLoading = ({ text = "加载中..." }: { text?: string }) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Loading size="lg" text={text} />
  </div>
)

// 按钮加载状态
const ButtonLoading = ({ size = "sm" }: { size?: "sm" | "md" }) => (
  <Loader2 className={cn("animate-spin", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
)

// 卡片加载状态
const CardLoading = ({ className }: { className?: string }) => (
  <div className={cn("p-6", className)}>
    <Loading text="加载中..." />
  </div>
)

// 全屏加载遮罩
const OverlayLoading = ({ text = "处理中..." }: { text?: string }) => (
  <Loading variant="overlay" size="lg" text={text} />
)

export { 
  Loading, 
  PageLoading, 
  ButtonLoading, 
  CardLoading, 
  OverlayLoading 
}
