"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, X, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ReviewLog } from '@/lib/types/data.types'
import { reviewLogService, CreateReviewLogData, UpdateReviewLogData } from '@/lib/services/review-log.service'
import { simpleToast as toast } from '@/hooks/use-toast'

interface ReviewLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewLog?: ReviewLog | null
  onSave: () => void
}

export function ReviewLogDialog({ open, onOpenChange, reviewLog, onSave }: ReviewLogDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    review_date: new Date(),
    mood: 'neutral' as 'positive' | 'neutral' | 'negative',
    emotion_score: 5,
    profit: '',
    profit_rate: '',
    tags: [] as string[],
    lessons_learned: '',
    next_plan: ''
  })
  const [newTag, setNewTag] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // 加载可用标签
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await reviewLogService.getAllTags()
        setAvailableTags(tags)
      } catch (error) {
        console.error('加载标签失败:', error)
      }
    }
    loadTags()
  }, [])

  // 初始化表单数据
  useEffect(() => {
    if (reviewLog) {
      setFormData({
        title: reviewLog.title,
        content: reviewLog.content,
        review_date: new Date(reviewLog.review_date || reviewLog.created_at),
        mood: reviewLog.mood,
        emotion_score: reviewLog.emotion_score || 5,
        profit: reviewLog.profit?.toString() || '',
        profit_rate: reviewLog.profit_rate?.toString() || '',
        tags: reviewLog.tags || [],
        lessons_learned: reviewLog.lessons_learned || '',
        next_plan: reviewLog.next_plan || ''
      })
    } else {
      // 重置表单
      setFormData({
        title: '',
        content: '',
        review_date: new Date(),
        mood: 'neutral',
        emotion_score: 5,
        profit: '',
        profit_rate: '',
        tags: [],
        lessons_learned: '',
        next_plan: ''
      })
    }
  }, [reviewLog, open])

  const handleSave = async () => {
    try {
      setLoading(true)

      // 验证必填字段
      if (!formData.title.trim()) {
        toast.error('请输入复盘标题')
        return
      }

      if (!formData.content.trim()) {
        toast.error('请输入复盘内容')
        return
      }

      const saveData: CreateReviewLogData | UpdateReviewLogData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        review_date: formData.review_date.toISOString(),
        mood: formData.mood,
        emotion_score: formData.emotion_score,
        profit: formData.profit ? parseFloat(formData.profit) : undefined,
        profit_rate: formData.profit_rate ? parseFloat(formData.profit_rate) : undefined,
        tags: formData.tags,
        lessons_learned: formData.lessons_learned.trim() || undefined,
        next_plan: formData.next_plan.trim() || undefined
      }

      if (reviewLog) {
        // 更新
        await reviewLogService.updateReviewLog({
          ...saveData,
          id: reviewLog.id
        } as UpdateReviewLogData)
        toast.success('复盘日志已更新')
      } else {
        // 创建
        await reviewLogService.createReviewLog(saveData as CreateReviewLogData)
        toast.success('复盘日志已创建')
      }

      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error('保存复盘日志失败:', error)
      toast.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addExistingTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'positive': return 'text-green-600 bg-green-50'
      case 'negative': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case 'positive': return '积极'
      case 'negative': return '消极'
      default: return '中性'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reviewLog ? '编辑复盘日志' : '创建复盘日志'}
          </DialogTitle>
          <DialogDescription>
            记录您的投资经验和心得，持续改进投资策略
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">复盘标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入复盘标题"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>复盘日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.review_date, 'PPP', { locale: zhCN })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.review_date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, review_date: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>情绪状态</Label>
                <Select 
                  value={formData.mood} 
                  onValueChange={(value: 'positive' | 'neutral' | 'negative') => 
                    setFormData(prev => ({ ...prev, mood: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        积极
                      </span>
                    </SelectItem>
                    <SelectItem value="neutral">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                        中性
                      </span>
                    </SelectItem>
                    <SelectItem value="negative">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        消极
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>情绪评分: {formData.emotion_score}</Label>
              <Slider
                value={[formData.emotion_score]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, emotion_score: value }))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 (很差)</span>
                <span>5 (一般)</span>
                <span>10 (很好)</span>
              </div>
            </div>
          </div>

          {/* 盈亏信息 */}
          <div className="space-y-4">
            <h4 className="font-medium">盈亏信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profit">盈亏金额 (¥)</Label>
                <Input
                  id="profit"
                  type="number"
                  value={formData.profit}
                  onChange={(e) => setFormData(prev => ({ ...prev, profit: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profit_rate">盈亏比例 (%)</Label>
                <Input
                  id="profit_rate"
                  type="number"
                  value={formData.profit_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, profit_rate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* 复盘内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">复盘内容 *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="详细描述您的投资决策过程、市场分析、操作细节等..."
              rows={6}
            />
          </div>

          {/* 标签管理 */}
          <div className="space-y-4">
            <Label>标签</Label>
            
            {/* 已选标签 */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* 添加新标签 */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="输入新标签"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* 常用标签 */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">常用标签</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.filter(tag => !formData.tags.includes(tag)).slice(0, 10).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => addExistingTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 经验教训 */}
          <div className="space-y-2">
            <Label htmlFor="lessons">经验教训</Label>
            <Textarea
              id="lessons"
              value={formData.lessons_learned}
              onChange={(e) => setFormData(prev => ({ ...prev, lessons_learned: e.target.value }))}
              placeholder="总结本次投资的经验教训..."
              rows={3}
            />
          </div>

          {/* 下一步计划 */}
          <div className="space-y-2">
            <Label htmlFor="next_plan">下一步计划</Label>
            <Textarea
              id="next_plan"
              value={formData.next_plan}
              onChange={(e) => setFormData(prev => ({ ...prev, next_plan: e.target.value }))}
              placeholder="制定下一步的投资计划和改进措施..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}