"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Accent = "accent" | "primary" | "success" | "warning" | "info";

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ElementType;
  accent?: Accent;
  className?: string;
}

const accentBgMap: Record<Accent, string> = {
  accent:
    "bg-accent/10 text-accent-foreground ring-1 ring-accent/30 dark:ring-accent/25",
  primary:
    "bg-primary/10 text-primary-foreground ring-1 ring-primary/30 dark:ring-primary/25",
  success:
    "bg-success/10 text-success-foreground ring-1 ring-success/30 dark:ring-success/25",
  warning:
    "bg-warning/10 text-warning-foreground ring-1 ring-warning/30 dark:ring-warning/25",
  info: "bg-info/10 text-info-foreground ring-1 ring-info/30 dark:ring-info/25",
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "accent",
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        // 轻新拟态质感
        "rounded-[var(--radius)] shadow-[0_6px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        "transition-colors duration-200 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground/90">
          {title}
        </CardTitle>
        {Icon ? (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
              accentBgMap[accent]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {subtitle ? (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default KpiCard;