"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarIcon, Plus, Trash2, Target, DollarSign, TrendingUp, Flag, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { InvestmentPlan } from '@/lib/types/data.types'
import { investmentPlanService, CreateInvestmentPlanData, UpdateInvestmentPlanData } from '@/lib/services/investment-plan.service'
import { simpleToast as toast } from '@/hooks/use-toast'

interface InvestmentPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: InvestmentPlan | null
  onSave?: () => void
}

interface AssetAllocation {
  name: string
  allocation: number
  currentPrice: number
  targetPrice: number
}

interface Milestone {
  title: string
  targetDate: string
  description: string
}

export function InvestmentPlanDialog({ open, onOpenChange, plan, onSave }: InvestmentPlanDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  // 基本信息
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  
  // 财务信息
  const [targetAmount, setTargetAmount] = useState<number>(0)
  const [currentAmount, setCurrentAmount] = useState<number>(0)
  const [expectedReturn, setExpectedReturn] = useState<number>(10)
  
  // 时间信息
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  
  // 资产配置
  const [assets, setAssets] = useState<AssetAllocation[]>([
    { name: '', allocation: 0, currentPrice: 0, targetPrice: 0 }
  ])
  
  // 里程碑
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: '', targetDate: '', description: '' }
  ])

  // 预设分类
  const categories = [
    '股票投资',
    '基金投资',
    '债券投资',
    '海外投资',
    '房地产投资',
    '数字货币',
    '商品期货',
    '混合投资',
    '其他'
  ]

  // 初始化表单数据
  useEffect(() => {
    if (plan) {
      setTitle(plan.title)
      setDescription(plan.description)
      setCategory(plan.category)
      setPriority(plan.priority)
      setRiskLevel(plan.riskLevel)
      setNotes(plan.notes || '')
      setTargetAmount(plan.targetAmount)
      setCurrentAmount(plan.currentAmount)
      setExpectedReturn(plan.expectedReturn)
      setStartDate(new Date(plan.startDate))
      setEndDate(new Date(plan.endDate))
      setAssets(plan.assets.length > 0 ? plan.assets : [{ name: '', allocation: 0, currentPrice: 0, targetPrice: 0 }])
      setMilestones(plan.milestones.length > 0 ? plan.milestones.map(m => ({
        title: m.title,
        targetDate: m.targetDate,
        description: m.description
      })) : [{ title: '', targetDate: '', description: '' }])
    } else {
      // 重置表单
      setTitle('')
      setDescription('')
      setCategory('')
      setPriority('medium')
      setRiskLevel('medium')
      setNotes('')
      setTargetAmount(0)
      setCurrentAmount(0)
      setExpectedReturn(10)
      setStartDate(undefined)
      setEndDate(undefined)
      setAssets([{ name: '', allocation: 0, currentPrice: 0, targetPrice: 0 }])
      setMilestones([{ title: '', targetDate: '', description: '' }])
    }
  }, [plan, open])

  // 添加资产配置
  const addAsset = () => {
    setAssets([...assets, { name: '', allocation: 0, currentPrice: 0, targetPrice: 0 }])
  }

  // 删除资产配置
  const removeAsset = (index: number) => {
    if (assets.length > 1) {
      setAssets(assets.filter((_, i) => i !== index))
    }
  }

  // 更新资产配置
  const updateAsset = (index: number, field: keyof AssetAllocation, value: string | number) => {
    const updatedAssets = [...assets]
    updatedAssets[index] = { ...updatedAssets[index], [field]: value }
    setAssets(updatedAssets)
  }

  // 添加里程碑
  const addMilestone = () => {
    setMilestones([...milestones, { title: '', targetDate: '', description: '' }])
  }

  // 删除里程碑
  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index))
    }
  }

  // 更新里程碑
  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updatedMilestones = [...milestones]
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value }
    setMilestones(updatedMilestones)
  }

  // 计算总配置比例
  const totalAllocation = assets.reduce((sum, asset) => sum + (asset.allocation || 0), 0)

  // 表单验证
  const validateForm = (): string | null => {
    if (!title.trim()) return '请输入计划标题'
    if (!description.trim()) return '请输入计划描述'
    if (!category) return '请选择投资分类'
    if (targetAmount <= 0) return '目标金额必须大于0'
    if (!startDate) return '请选择开始日期'
    if (!endDate) return '请选择结束日期'
    if (endDate <= startDate) return '结束日期必须晚于开始日期'
    if (expectedReturn < 0) return '预期收益率不能为负数'
    
    // 验证资产配置
    const validAssets = assets.filter(asset => asset.name.trim())
    if (validAssets.length === 0) return '请至少添加一个资产配置'
    
    if (Math.abs(totalAllocation - 100) > 0.01 && totalAllocation > 0) {
      return '资产配置比例总和应为100%'
    }

    // 验证里程碑
    const validMilestones = milestones.filter(milestone => milestone.title.trim())
    if (validMilestones.length === 0) return '请至少添加一个里程碑'

    return null
  }

  // 保存投资计划
  const handleSave = async () => {
    const error = validateForm()
    if (error) {
      toast.error(error)
      return
    }

    setLoading(true)
    try {
      const validAssets = assets.filter(asset => asset.name.trim())
      const validMilestones = milestones.filter(milestone => milestone.title.trim())

      const planData = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        riskLevel,
        notes: notes.trim(),
        targetAmount,
        expectedReturn,
        startDate: format(startDate!, 'yyyy-MM-dd'),
        endDate: format(endDate!, 'yyyy-MM-dd'),
        assets: validAssets,
        milestones: validMilestones
      }

      if (plan) {
        // 更新现有计划
        await investmentPlanService.updatePlan({
          id: plan.id,
          currentAmount,
          ...planData
        } as UpdateInvestmentPlanData)
        toast.success('投资计划更新成功')
      } else {
        // 创建新计划
        await investmentPlanService.createPlan(planData as CreateInvestmentPlanData)
        toast.success('投资计划创建成功')
      }

      onSave?.()
      onOpenChange(false)
    } catch (error) {
      console.error('保存投资计划失败:', error)
      toast.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {plan ? '编辑投资计划' : '创建投资计划'}
          </DialogTitle>
          <DialogDescription>
            {plan ? '修改投资计划的详细信息' : '制定新的投资计划，设定目标和执行策略'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="financial">财务设置</TabsTrigger>
            <TabsTrigger value="assets">资产配置</TabsTrigger>
            <TabsTrigger value="milestones">执行计划</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">计划标题 *</Label>
                <Input
                  id="title"
                  placeholder="输入投资计划标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">投资分类 *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择投资分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">计划描述 *</Label>
              <Textarea
                id="description"
                placeholder="详细描述投资计划的目标和策略"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>优先级</Label>
                <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高优先级</SelectItem>
                    <SelectItem value="medium">中优先级</SelectItem>
                    <SelectItem value="low">低优先级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>风险等级</Label>
                <Select value={riskLevel} onValueChange={(value: 'low' | 'medium' | 'high') => setRiskLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低风险</SelectItem>
                    <SelectItem value="medium">中风险</SelectItem>
                    <SelectItem value="high">高风险</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>预期收益率 (%)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[expectedReturn]}
                    onValueChange={(value) => setExpectedReturn(value[0])}
                    max={50}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {expectedReturn}%
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">计划备注</Label>
              <Textarea
                id="notes"
                placeholder="记录投资策略、注意事项等"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    投资金额
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAmount">目标金额 (元) *</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      placeholder="0"
                      value={targetAmount || ''}
                      onChange={(e) => setTargetAmount(Number(e.target.value))}
                    />
                  </div>
                  {plan && (
                    <div className="space-y-2">
                      <Label htmlFor="currentAmount">当前金额 (元)</Label>
                      <Input
                        id="currentAmount"
                        type="number"
                        placeholder="0"
                        value={currentAmount || ''}
                        onChange={(e) => setCurrentAmount(Number(e.target.value))}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    时间规划
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>开始日期 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP", { locale: zhCN }) : "选择开始日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>结束日期 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP", { locale: zhCN }) : "选择结束日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            </div>

            {targetAmount > 0 && startDate && endDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    投资概览
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        ¥{targetAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">目标金额</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {expectedReturn}%
                      </div>
                      <div className="text-sm text-muted-foreground">预期年化收益</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))}
                      </div>
                      <div className="text-sm text-muted-foreground">投资月数</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">资产配置</h3>
                <p className="text-sm text-muted-foreground">
                  设置投资组合中各资产的配置比例
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={totalAllocation === 100 ? "default" : "secondary"}>
                  总配置: {totalAllocation.toFixed(1)}%
                </Badge>
                <Button onClick={addAsset} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  添加资产
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {assets.map((asset, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>资产名称</Label>
                        <Input
                          placeholder="如：腾讯控股"
                          value={asset.name}
                          onChange={(e) => updateAsset(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>配置比例 (%)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={asset.allocation || ''}
                          onChange={(e) => updateAsset(index, 'allocation', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>当前价格</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={asset.currentPrice || ''}
                          onChange={(e) => updateAsset(index, 'currentPrice', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>目标价格</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={asset.targetPrice || ''}
                          onChange={(e) => updateAsset(index, 'targetPrice', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAsset(index)}
                          disabled={assets.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">执行里程碑</h3>
                <p className="text-sm text-muted-foreground">
                  设置投资计划的关键节点和目标
                </p>
              </div>
              <Button onClick={addMilestone} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加里程碑
              </Button>
            </div>

            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>里程碑标题</Label>
                        <Input
                          placeholder="如：完成初始建仓"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>目标日期</Label>
                        <Input
                          type="date"
                          value={milestone.targetDate}
                          onChange={(e) => updateMilestone(index, 'targetDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>详细描述</Label>
                        <Input
                          placeholder="描述具体目标"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        />
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                          disabled={milestones.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : (plan ? '更新计划' : '创建计划')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}