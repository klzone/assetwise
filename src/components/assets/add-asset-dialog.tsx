"use client"

import React, { useState } from 'react'
import { Plus, Upload, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AssetFormData {
  name: string
  symbol: string
  category: string
  purchasePrice: string
  quantity: string
  purchaseDate: string
  notes: string
  logo?: string
}

interface AddAssetDialogProps {
  onAddAsset: (asset: AssetFormData) => void
  trigger?: React.ReactNode
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
  { value: 'low', label: '低风险', color: 'bg-success/10 text-success' },
  { value: 'medium', label: '中风险', color: 'bg-warning/10 text-warning' },
  { value: 'high', label: '高风险', color: 'bg-destructive/10 text-destructive' }
]

export function AddAssetDialog({ onAddAsset, trigger }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    symbol: '',
    category: '',
    purchasePrice: '',
    quantity: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    logo: ''
  })

  const handleInputChange = (field: keyof AssetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onAddAsset(formData)
      
      // 重置表单
      setFormData({
        name: '',
        symbol: '',
        category: '',
        purchasePrice: '',
        quantity: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
        logo: ''
      })
      
      setOpen(false)
    } catch (error) {
      console.error('添加资产失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.name && formData.symbol && formData.category && 
                     formData.purchasePrice && formData.quantity

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="bg-primary hover:bg-primary-hover">
            <Plus className="h-4 w-4 mr-2" />
            添加资产
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            添加新资产
          </DialogTitle>
          <DialogDescription>
            填写资产信息以添加到您的投资组合中
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">资产名称 *</Label>
                <Input
                  id="name"
                  placeholder="例如：苹果公司"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">交易代码 *</Label>
                <Input
                  id="symbol"
                  placeholder="例如：AAPL"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
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
          </div>

          {/* 购买信息 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">购买价格 *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">购买数量 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="1"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">购买日期</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              />
            </div>
          </div>

          {/* 可选信息 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL (可选)</Label>
              <div className="flex gap-2">
                <Input
                  id="logo"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo}
                  onChange={(e) => handleInputChange('logo', e.target.value)}
                />
                {formData.logo && (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={formData.logo} alt="预览" />
                    <AvatarFallback>{formData.symbol.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注 (可选)</Label>
              <Textarea
                id="notes"
                placeholder="添加关于此资产的备注..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* 预览信息 */}
          {isFormValid && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">预览信息</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">总投入：</span>
                  <span className="font-medium">
                    ¥{(parseFloat(formData.purchasePrice || '0') * parseFloat(formData.quantity || '0')).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">单价：</span>
                  <span className="font-medium">¥{parseFloat(formData.purchasePrice || '0').toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={!isFormValid || isLoading}>
              {isLoading ? '添加中...' : '添加资产'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}