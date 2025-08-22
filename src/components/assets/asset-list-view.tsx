"use client"

import React from 'react'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLocale } from '@/contexts/locale-context'
import { AssetData } from './asset-card'

interface AssetListViewProps {
  assets: AssetData[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onClick?: (id: string) => void
}

export function AssetListView({ 
  assets, 
  onView, 
  onEdit, 
  onDelete, 
  onClick 
}: AssetListViewProps) {
  const { formatCurrency, formatPercent, getProfitLossColorClass } = useLocale()

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'secondary'
      case 'medium': return 'default'
      case 'high': return 'destructive'
      default: return 'outline'
    }
  }

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '低风险'
      case 'medium': return '中风险'
      case 'high': return '高风险'
      default: return '未知'
    }
  }

  return (
    <div className="modern-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">资产</TableHead>
            <TableHead className="text-right">当前价格</TableHead>
            <TableHead className="text-right">持有数量</TableHead>
            <TableHead className="text-right">总价值</TableHead>
            <TableHead className="text-right">盈亏</TableHead>
            <TableHead className="text-right">日涨跌</TableHead>
            <TableHead className="text-center">风险等级</TableHead>
            <TableHead className="text-center">配置占比</TableHead>
            <TableHead className="text-center">更新时间</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow 
              key={asset.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onClick?.(asset.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={asset.logo} alt={asset.name} />
                    <AvatarFallback>
                      {asset.symbol.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {asset.symbol} • {asset.category}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="text-right font-mono">
                {formatCurrency(asset.currentPrice)}
              </TableCell>
              
              <TableCell className="text-right font-mono">
                {asset.quantity.toLocaleString()}
              </TableCell>
              
              <TableCell className="text-right font-mono font-medium">
                {formatCurrency(asset.totalValue)}
              </TableCell>
              
              <TableCell className="text-right">
                <div className={`font-mono ${getProfitLossColorClass(asset.profitLoss)}`}>
                  <div>
                    {asset.profitLoss >= 0 ? '+' : ''}{formatCurrency(asset.profitLoss)}
                  </div>
                  <div className="text-xs">
                    ({formatPercent(asset.profitLossPercent)})
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className={`flex items-center justify-end gap-1 ${getProfitLossColorClass(asset.dayChange)}`}>
                  {asset.dayChange >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <div className="font-mono text-sm">
                    <div>
                      {asset.dayChange >= 0 ? '+' : ''}{formatCurrency(asset.dayChange)}
                    </div>
                    <div className="text-xs">
                      ({formatPercent(asset.dayChangePercent)})
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="text-center">
                <Badge variant={getRiskBadgeVariant(asset.riskLevel)}>
                  {getRiskLabel(asset.riskLevel)}
                </Badge>
              </TableCell>
              
              <TableCell className="text-center font-mono">
                {formatPercent(asset.allocation)}
              </TableCell>
              
              <TableCell className="text-center text-sm text-muted-foreground">
                {asset.lastUpdated}
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onView(asset.id)
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      查看详情
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onEdit(asset.id)
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(asset.id)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}