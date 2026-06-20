import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Tone = "default" | "positive" | "negative" | "warning" | "muted"

const toneClass: Record<Tone, string> = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-destructive",
  warning: "text-warning",
  muted: "text-muted-foreground",
}

export function PageShell({
  children,
  className,
  size = "default",
}: {
  children: ReactNode
  className?: string
  size?: "default" | "narrow"
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_76%_8%,rgb(236_241_248)_0%,transparent_30%),linear-gradient(180deg,rgb(250_250_250)_0%,rgb(245_247_250)_100%)]">
      <div
        className={cn(
          "mx-auto w-full px-4 py-5 sm:px-6 lg:px-12 lg:py-7",
          size === "default" ? "max-w-[1440px]" : "max-w-5xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn("mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="label-tiny mb-2">{eyebrow}</p> : null}
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}

export function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "default",
  action,
  className,
  valueClassName,
  iconClassName,
}: {
  title: string
  value: ReactNode
  detail?: ReactNode
  icon?: LucideIcon
  tone?: Tone
  action?: ReactNode
  className?: string
  valueClassName?: string
  iconClassName?: string
}) {
  const resolvedValueClassName = valueClassName ?? toneClass[tone]
  const resolvedIconClassName = iconClassName ?? toneClass[tone]

  return (
    <section
      className={cn(
        "rounded-[1.15rem] border border-white/80 bg-card/78 p-4 shadow-[0_18px_56px_rgb(15_23_42_/_0.075)] backdrop-blur-xl transition-smooth hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgb(15_23_42_/_0.1)]",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="label-tiny">{title}</p>
        {Icon ? <Icon className={cn("h-3.5 w-3.5", resolvedIconClassName)} aria-hidden="true" /> : action}
      </div>
      <div className={cn("font-tabular text-2xl font-semibold leading-none sm:text-3xl", resolvedValueClassName)}>{value}</div>
      {detail ? <div className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</div> : null}
    </section>
  )
}

export function SectionPanel({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  eyebrow?: string
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section
      className={cn(
        "rounded-[1.15rem] border border-white/80 bg-card/78 p-4 shadow-[0_18px_56px_rgb(15_23_42_/_0.075)] backdrop-blur-xl",
        className,
      )}
    >
      {(eyebrow || title || description || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? <p className="label-tiny mb-1.5">{eyebrow}</p> : null}
            {title ? <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}

export function FilterToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
  className,
}: {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2.5 rounded-2xl border border-white/80 bg-card/72 p-2.5 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between", className)}>
      {onSearchChange ? (
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 rounded-full bg-background pl-8 text-sm"
            type="search"
          />
        </div>
      ) : null}
      {(filters || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {filters}
          {actions}
        </div>
      )}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-secondary/70 px-5 py-8 text-center", className)}>
      {Icon ? (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ResponsiveDataView({
  table,
  cards,
  className,
}: {
  table: ReactNode
  cards: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="hidden md:block">{table}</div>
      <div className="grid gap-3 md:hidden">{cards}</div>
    </div>
  )
}
