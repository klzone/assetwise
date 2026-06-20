"use client"

import React, { useState } from 'react'
import { Download, FileText, FileSpreadsheet, FileImage, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { AssetData } from './asset-card'

interface ExportDialogProps {
  assets: AssetData[]
  trigger?: React.ReactNode
}

type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json'
type ExportField = 'name' | 'symbol' | 'category' | 'currentPrice' | 'purchasePrice' | 
                   'quantity' | 'totalValue' | 'totalCost' | 'profitLoss' | 'profitLossPercent' |
                   'dayChange' | 'dayChangePercent' | 'allocation' | 'riskLevel' | 'lastUpdated'

const exportFormats = [
  { value: 'csv', label: 'CSV 文件', icon: FileText, description: '逗号分隔值文件，适合Excel打开' },
  { value: 'excel', label: 'Excel 文件', icon: FileSpreadsheet, description: 'Microsoft Excel格式' },
  { value: 'pdf', label: 'PDF 报告', icon: FileImage, description: '包含图表的完整报告' },
  { value: 'json', label: 'JSON 数据', icon: FileText, description: '结构化数据格式' }
] as const

const exportFields = [
  { key: 'name', label: '资产名称', required: true },
  { key: 'symbol', label: '交易代码', required: true },
  { key: 'category', label: '资产分类', required: false },
  { key: 'currentPrice', label: '当前价格', required: false },
  { key: 'purchasePrice', label: '购买价格', required: false },
  { key: 'quantity', label: '持仓数量', required: false },
  { key: 'totalValue', label: '总价值', required: false },
  { key: 'totalCost', label: '总成本', required: false },
  { key: 'profitLoss', label: '盈亏金额', required: false },
  { key: 'profitLossPercent', label: '盈亏比例', required: false },
  { key: 'dayChange', label: '今日变化', required: false },
  { key: 'dayChangePercent', label: '今日涨跌幅', required: false },
  { key: 'allocation', label: '配置占比', required: false },
  { key: 'riskLevel', label: '风险等级', required: false },
  { key: 'lastUpdated', label: '最后更新', required: false }
] as const

export function ExportDialog({ assets, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [selectedFields, setSelectedFields] = useState<ExportField[]>([
    'name', 'symbol', 'category', 'currentPrice', 'totalValue', 'profitLoss', 'profitLossPercent'
  ])
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)

  const handleFieldToggle = (field: ExportField, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, field])
    } else {
      const fieldInfo = exportFields.find(f => f.key === field)
      if (!fieldInfo?.required) {
        setSelectedFields(prev => prev.filter(f => f !== field))
      }
    }
  }

  const generateCSV = (data: AssetData[], fields: ExportField[]): string => {
    const headers = fields.map(field => {
      const fieldInfo = exportFields.find(f => f.key === field)
      return fieldInfo?.label || field
    })

    const rows = data.map(asset => {
      return fields.map(field => {
        const value = asset[field]
        if (typeof value === 'number') {
          return value.toString()
        }
        return `"${value}"`
      })
    })

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const generateJSON = (data: AssetData[], fields: ExportField[]) => {
    const filteredData = data.map(asset => {
      const filtered: Partial<Record<ExportField, AssetData[ExportField]>> = {}
      fields.forEach(field => {
        filtered[field] = asset[field]
      })
      return filtered
    })

    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalAssets: data.length,
      fields: fields,
      data: filteredData
    }, null, 2)
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const timestamp = new Date().toISOString().split('T')[0]
      
      switch (format) {
        case 'csv':
          const csvContent = generateCSV(assets, selectedFields)
          downloadFile(csvContent, `assets-${timestamp}.csv`, 'text/csv')
          break

        case 'json':
          const jsonContent = generateJSON(assets, selectedFields)
          downloadFile(jsonContent, `assets-${timestamp}.json`, 'application/json')
          break

        case 'excel':
          // 模拟Excel导出
          const excelContent = generateCSV(assets, selectedFields)
          downloadFile(excelContent, `assets-${timestamp}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
          break

        case 'pdf':
          // 模拟PDF导出
          alert('PDF导出功能正在开发中，请使用其他格式')
          break
      }

      // 模拟导出延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setOpen(false)
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  const selectedFormat = exportFormats.find(f => f.value === format)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            导出资产数据
          </DialogTitle>
          <DialogDescription>
            选择导出格式和要包含的字段，共 {assets.length} 项资产
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 导出格式选择 */}
          <div className="space-y-3">
            <Label>导出格式</Label>
            <Select value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportFormats.map(format => {
                  const Icon = format.icon
                  return (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{format.label}</div>
                          <div className="text-xs text-muted-foreground">{format.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 字段选择 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>导出字段</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFields(exportFields.map(f => f.key))}
                >
                  全选
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFields(exportFields.filter(f => f.required).map(f => f.key))}
                >
                  仅必需
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {exportFields.map(field => {
                const isSelected = selectedFields.includes(field.key)
                const isRequired = field.required
                
                return (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={isSelected}
                      disabled={isRequired}
                      onCheckedChange={(checked) => handleFieldToggle(field.key, checked as boolean)}
                    />
                    <Label 
                      htmlFor={field.key} 
                      className={`text-sm ${isRequired ? 'font-medium' : ''}`}
                    >
                      {field.label}
                      {isRequired && <Badge variant="secondary" className="ml-1 text-xs">必需</Badge>}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* PDF特殊选项 */}
          {format === 'pdf' && (
            <div className="space-y-3">
              <Label>PDF选项</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                  />
                  <Label htmlFor="includeCharts" className="text-sm">
                    包含图表
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSummary"
                    checked={includeSummary}
                    onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                  />
                  <Label htmlFor="includeSummary" className="text-sm">
                    包含汇总信息
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* 预览信息 */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">导出预览</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">格式：</span>
                <span className="font-medium">{selectedFormat?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">资产数量：</span>
                <span className="font-medium">{assets.length} 项</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">包含字段：</span>
                <span className="font-medium">{selectedFields.length} 个</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedFields.length === 0}
          >
            {isExporting ? '导出中...' : '开始导出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
