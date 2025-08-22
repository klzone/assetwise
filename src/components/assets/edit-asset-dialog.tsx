"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AssetData } from './asset-card'

interface EditAssetDialogProps {
  asset: AssetData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<AssetData>) => void
}

// 系统化的资产大类分类
const categories = [
  '股票',        // 包含各种股票类型
  '基金',        // 公募基金、私募基金、ETF等
  '债券',        // 国债、企业债、可转债等
  '房地产',      // 住宅、商业地产、REITs等
  '现金',        // 银行存款、货币基金、理财产品
  '虚拟货币',    // 比特币、以太坊等数字资产
  '保险',        // 寿险、年金险、投连险等
  '贵金属',      // 黄金、白银、铂金等
  '其他'         // 其他类型资产
]

const riskLevels = [
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' }
]

export function EditAssetDialog({ 
  asset, 
  open, 
  onOpenChange, 
  onSave 
}: EditAssetDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    category: '',
    purchasePrice: '',
    quantity: '',
    riskLevel: 'medium' as 'low' | 'medium' | 'high'
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        symbol: asset.symbol || '',
        category: asset.category || '',
        purchasePrice: (asset.purchasePrice || 0).toString(),
        quantity: (asset.quantity || 0).toString(),
        riskLevel: asset.riskLevel || 'medium'
      })
    }
  }, [asset])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!asset) return

    setIsLoading(true)

    try {
      const purchasePrice = parseFloat(formData.purchasePrice)
      const quantity = parseInt(formData.quantity)
      
      const updates: Partial<AssetData> = {
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        category: formData.category,
        purchasePrice,
        quantity,
        riskLevel: formData.riskLevel,
        totalCost: purchasePrice * quantity,
        totalValue: asset.currentPrice * quantity, // 使用当前价格计算总价值
        profitLoss: (asset.currentPrice * quantity) - (purchasePrice * quantity),
        profitLossPercent: purchasePrice > 0 ? ((asset.currentPrice - purchasePrice) / purchasePrice) * 100 : 0
      }

      onSave(asset.id, updates)
      onOpenChange(false)
    } catch (error) {
      console.error('保存资产失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑资产</DialogTitle>
          <DialogDescription>
            修改资产信息，系统将自动重新计算相关数据。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">资产名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="例如：苹果公司"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">交易代码 *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                placeholder="例如：AAPL"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">资产分类 *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择资产分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">购买价格 *</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">持有数量 *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskLevel">风险等级</Label>
            <Select value={formData.riskLevel} onValueChange={(value) => handleInputChange('riskLevel', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {riskLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存更改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}