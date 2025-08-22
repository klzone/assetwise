"use client"

import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, DollarSign, ArrowDownLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useLocale } from '@/contexts/locale-context'

interface SellAssetDialogProps {
  asset: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSell: (data: any) => void
}

export function SellAssetDialog({
  asset,
  open,
  onOpenChange,
  onSell
}: SellAssetDialogProps) {
  const { formatCurrency, formatPercent, getProfitLossColorClass } = useLocale()
  const [sellPrice, setSellPrice] = useState('')
  const [sellQuantity, setSellQuantity] = useState('')
  const [sellDate, setSellDate] = useState<Date>(new Date())
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  
  // 交易预览数据
  const [preview, setPreview] = useState({
    sellTotal: 0,
    costTotal: 0,
    profit: 0,
    profitPercent: 0,
    remainingQuantity: 0
  })
  
  // 当资产变化时重置表单
  useEffect(() => {
    if (asset && open) {
      setSellPrice((asset.currentPrice || 0).toString())
      setSellQuantity((asset.quantity || 0).toString())
      setSellDate(new Date())
      setNotes('')
      updatePreview((asset.currentPrice || 0).toString(), (asset.quantity || 0).toString(), asset)
    }
  }, [asset, open])
  
  // 更新交易预览
  const updatePreview = (price: string, quantity: string, currentAsset: any) => {
    if (!currentAsset) return
    
    const sellPriceNum = parseFloat(price) || 0
    const sellQuantityNum = parseInt(quantity) || 0
    const costPerUnit = currentAsset.totalCost / currentAsset.quantity
    
    const sellTotal = sellPriceNum * sellQuantityNum
    const costTotal = costPerUnit * sellQuantityNum
    const profit = sellTotal - costTotal
    const profitPercent = costTotal > 0 ? (profit / costTotal) * 100 : 0
    const remainingQuantity = currentAsset.quantity - sellQuantityNum
    
    setPreview({
      sellTotal,
      costTotal,
      profit,
      profitPercent,
      remainingQuantity
    })
  }
  
  // 当价格或数量变化时更新预览
  useEffect(() => {
    if (asset) {
      updatePreview(sellPrice, sellQuantity, asset)
    }
  }, [sellPrice, sellQuantity, asset])
  
  // 表单验证
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!sellPrice || isNaN(parseFloat(sellPrice)) || parseFloat(sellPrice) <= 0) {
      newErrors.sellPrice = '请输入有效的卖出价格'
    }
    
    if (!sellQuantity || isNaN(parseInt(sellQuantity)) || parseInt(sellQuantity) <= 0) {
      newErrors.sellQuantity = '请输入有效的卖出数量'
    } else if (asset && parseInt(sellQuantity) > asset.quantity) {
      newErrors.sellQuantity = `卖出数量不能超过持有数量 (${asset.quantity})`
    }
    
    if (!sellDate) {
      newErrors.sellDate = '请选择卖出日期'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSell({
        sellPrice: parseFloat(sellPrice),
        sellQuantity: parseInt(sellQuantity),
        sellDate,
        notes
      })
      onOpenChange(false)
    }
  }
  
  if (!asset) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownLeft className="h-5 w-5 text-red-500" />
            卖出资产
          </DialogTitle>
          <DialogDescription>
            卖出 {asset.name} ({asset.symbol})
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 卖出价格 */}
          <div className="space-y-2">
            <label htmlFor="sellPrice" className="text-sm font-medium">卖出价格</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                placeholder="输入卖出价格"
                className="pl-10"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
              />
            </div>
            {errors.sellPrice && <p className="text-sm text-red-500">{errors.sellPrice}</p>}
            <p className="text-sm text-muted-foreground">
              当前市场价格: {formatCurrency(asset.currentPrice)}
            </p>
          </div>
          
          {/* 卖出数量 */}
          <div className="space-y-2">
            <label htmlFor="sellQuantity" className="text-sm font-medium">卖出数量</label>
            <Input
              id="sellQuantity"
              type="number"
              placeholder="输入卖出数量"
              value={sellQuantity}
              onChange={(e) => setSellQuantity(e.target.value)}
            />
            {errors.sellQuantity && <p className="text-sm text-red-500">{errors.sellQuantity}</p>}
            <p className="text-sm text-muted-foreground">
              当前持有: {asset.quantity} 单位
            </p>
          </div>
          
          {/* 卖出日期 */}
          <div className="space-y-2">
            <label htmlFor="sellDate" className="text-sm font-medium">卖出日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="sellDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !sellDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sellDate ? format(sellDate, "yyyy年MM月dd日") : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={sellDate}
                  onSelect={(date) => date && setSellDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.sellDate && <p className="text-sm text-red-500">{errors.sellDate}</p>}
          </div>
          
          {/* 备注 */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">备注</label>
            <Textarea
              id="notes"
              placeholder="添加交易备注（可选）"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          {/* 交易预览 */}
          <div className="rounded-lg border p-3 space-y-2">
            <h4 className="font-medium text-sm">交易预览</h4>
            
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="text-muted-foreground">卖出总额:</div>
              <div className="font-medium">{formatCurrency(preview.sellTotal)}</div>
              
              <div className="text-muted-foreground">成本总额:</div>
              <div className="font-medium">{formatCurrency(preview.costTotal)}</div>
              
              <div className="text-muted-foreground">预计盈亏:</div>
              <div className={`font-medium ${getProfitLossColorClass(preview.profit)}`}>
                {preview.profit >= 0 ? '+' : ''}{formatCurrency(preview.profit)} ({formatPercent(preview.profitPercent)})
              </div>
              
              <div className="text-muted-foreground">剩余数量:</div>
              <div className="font-medium">{preview.remainingQuantity} 单位</div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" className="bg-red-500 hover:bg-red-600">
              卖出资产
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}