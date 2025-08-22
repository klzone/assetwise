"use client"

import React from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  Calendar,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLocale } from '@/contexts/locale-context'

export interface AssetData {
  id: string
  name: string
  symbol: string
  logo?: string
  category: string
  currentPrice: number
  purchasePrice: number
  quantity: number
  totalValue: number
  totalCost: number
  profitLoss: number
  profitLossPercent: number
  dayChange: number
  dayChangePercent: number
  allocation: number
  lastUpdated: string
  riskLevel: 'low' | 'medium' | 'high'
  isDeleted?: boolean
  deletedAt?: string
}

interface AssetCardProps {
  asset: AssetData
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: (id: string) => void
  className?: string
}

export function AssetCard({ asset, onView, onEdit, onDelete, onClick, className }: AssetCardProps) {
  const { formatCurrency, formatPercent, getProfitLossColorClass } = useLocale()
  
  const isProfitable = asset.profitLoss >= 0
  const isDayPositive = asset.dayChange >= 0
  
  const profitLossColor = getProfitLossColorClass(asset.profitLoss)
  const dayChangeColor = getProfitLossColorClass(asset.dayChange)

  const handleCardClick = () => {
    if (onClick) {
      onClick(asset.id)
    } else if (onView) {
      onView(asset.id)
    }
  }
  
  const riskColors = {
    low: 'bg-success/10 text-success border-success/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    high: 'bg-destructive/10 text-destructive border-destructive/20'
  }
  
  const riskLabels = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }

  return (
    <Card 
      className={`modern-card-hover group cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={asset.logo} alt={asset.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {asset.symbol.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base leading-none truncate">{asset.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground truncate">{asset.symbol}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs shrink-0 ${riskColors[asset.riskLevel]}`}
                >
                  {riskLabels[asset.riskLevel]}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(asset.id); }}>
                <Eye className="h-4 w-4 mr-2" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(asset.id); }}>
                <Edit className="h-4 w-4 mr-2" />
                编辑资产
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete?.(asset.id); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除资产
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 价格信息 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">当前价格</p>
            <p className="text-lg font-bold truncate" title={formatCurrency(asset.currentPrice)}>
              {formatCurrency(asset.currentPrice)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">今日变化</p>
            <div className={`flex items-center gap-1 ${dayChangeColor} min-w-0`}>
              {isDayPositive ? (
                <ArrowUpRight className="h-3 w-3 shrink-0" />
              ) : (
                <ArrowDownRight className="h-3 w-3 shrink-0" />
              )}
              <div className="min-w-0 flex flex-col">
                <span className="text-sm font-medium truncate" title={`${isDayPositive ? '+' : ''}${formatCurrency(asset.dayChange)}`}>
                  {isDayPositive ? '+' : ''}{formatCurrency(asset.dayChange)}
                </span>
                <span className="text-xs truncate" title={`(${formatPercent(asset.dayChangePercent)})`}>
                  ({formatPercent(asset.dayChangePercent)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 持仓信息 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">持仓数量</p>
            <p className="text-sm font-medium truncate" title={`${asset.quantity.toLocaleString()} 股`}>
              {asset.quantity.toLocaleString()} 股
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">持仓成本</p>
            <p className="text-sm font-medium truncate" title={formatCurrency(asset.purchasePrice)}>
              {formatCurrency(asset.purchasePrice)}
            </p>
          </div>
        </div>

        {/* 总价值和盈亏 */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">总价值</span>
            <span className="text-sm font-bold truncate ml-2" title={formatCurrency(asset.totalValue)}>
              {formatCurrency(asset.totalValue)}
            </span>
          </div>
          <div className="flex justify-between items-center min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">盈亏</span>
            <div className={`flex items-center gap-1 ${profitLossColor} min-w-0 ml-2`}>
              {isProfitable ? (
                <TrendingUp className="h-3 w-3 shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 shrink-0" />
              )}
              <div className="min-w-0 flex flex-col items-end">
                <span className="text-sm font-medium truncate" title={`${isProfitable ? '+' : ''}${formatCurrency(asset.profitLoss)}`}>
                  {isProfitable ? '+' : ''}{formatCurrency(asset.profitLoss)}
                </span>
                <span className="text-xs truncate" title={`(${formatPercent(asset.profitLossPercent)})`}>
                  ({formatPercent(asset.profitLossPercent)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 资产配置占比 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">配置占比</span>
    <span className="text-xs font-medium">{(asset.allocation || 0).toFixed(1)}%</span>
          </div>
          <Progress value={asset.allocation} className="h-1.5" />
        </div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{asset.lastUpdated}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {asset.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// 资产卡片网格容器组件
interface AssetGridProps {
  assets: AssetData[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: (id: string) => void
  className?: string
}

export function AssetGrid({ assets, onView, onEdit, onDelete, onClick, className }: AssetGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onClick={onClick}
        />
      ))}
    </div>
  )
}

// 资产卡片骨架屏组件
export function AssetCardSkeleton() {
  return (
    <Card className="modern-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-4 w-18 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded animate-pulse" />
          <div className="h-1.5 w-full bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}