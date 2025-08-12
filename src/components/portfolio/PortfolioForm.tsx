import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Minus, 
  Save, 
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Portfolio, CreatePortfolioData, UpdatePortfolioData } from '@/lib/types/portfolio.types';
import { portfolioService } from '@/lib/services/portfolio.service';
import { cn } from '@/lib/utils';

interface PortfolioFormProps {
  userId: string;
  portfolio?: Portfolio | null;
  onSave: (portfolio: Portfolio) => void;
  onCancel: () => void;
}

interface AssetAllocation {
  asset_type: string;
  target_percentage: number;
}

const ASSET_TYPES = [
  { value: '股票', label: '股票', description: '国内外股票投资' },
  { value: '债券', label: '债券', description: '政府债券、企业债券等' },
  { value: '基金', label: '基金', description: '股票基金、债券基金、混合基金' },
  { value: '现金', label: '现金', description: '银行存款、货币基金' },
  { value: '房地产', label: '房地产', description: 'REITs、房地产投资' },
  { value: '商品', label: '商品', description: '黄金、原油等大宗商品' },
  { value: '加密货币', label: '加密货币', description: '比特币、以太坊等数字货币' }
];

export const PortfolioForm: React.FC<PortfolioFormProps> = ({
  userId,
  portfolio,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    risk_level: 'moderate' as 'conservative' | 'moderate' | 'aggressive',
    investment_goal: '',
    time_horizon: 5,
    initial_amount: 100000,
    rebalance_threshold: 5
  });

  const [allocations, setAllocations] = useState<AssetAllocation[]>([
    { asset_type: '股票', target_percentage: 60 },
    { asset_type: '债券', target_percentage: 30 },
    { asset_type: '现金', target_percentage: 10 }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isEditing = !!portfolio;

  useEffect(() => {
    if (portfolio) {
      setFormData({
        name: portfolio.name,
        description: portfolio.description || '',
        risk_level: portfolio.risk_level,
        investment_goal: portfolio.investment_goal,
        time_horizon: portfolio.time_horizon,
        initial_amount: portfolio.target_value,
        rebalance_threshold: portfolio.rebalance_threshold
      });

      setAllocations(
        portfolio.target_allocation.map(allocation => ({
          asset_type: allocation.asset_type,
          target_percentage: allocation.target_percentage
        }))
      );
    }
  }, [portfolio]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('投资组合名称不能为空');
    }

    if (!formData.investment_goal.trim()) {
      errors.push('投资目标不能为空');
    }

    if (formData.time_horizon < 1 || formData.time_horizon > 50) {
      errors.push('投资期限必须在1-50年之间');
    }

    if (formData.initial_amount <= 0) {
      errors.push('初始投资金额必须大于0');
    }

    if (formData.rebalance_threshold <= 0 || formData.rebalance_threshold > 50) {
      errors.push('重新平衡阈值必须在0-50%之间');
    }

    if (allocations.length === 0) {
      errors.push('至少需要设置一个资产配置');
    }

    const totalAllocation = allocations.reduce((sum, allocation) => sum + allocation.target_percentage, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      errors.push(`资产配置总和必须为100%，当前为${totalAllocation.toFixed(2)}%`);
    }

    allocations.forEach((allocation, index) => {
      if (!allocation.asset_type.trim()) {
        errors.push(`第${index + 1}个资产配置的类型不能为空`);
      }
      if (allocation.target_percentage <= 0 || allocation.target_percentage > 100) {
        errors.push(`第${index + 1}个资产配置的百分比必须在0-100%之间`);
      }
    });

    // 检查重复的资产类型
    const assetTypes = allocations.map(a => a.asset_type);
    const duplicates = assetTypes.filter((type, index) => assetTypes.indexOf(type) !== index);
    if (duplicates.length > 0) {
      errors.push('资产类型不能重复');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && portfolio) {
        const updateData: UpdatePortfolioData = {
          name: formData.name,
          description: formData.description,
          risk_level: formData.risk_level,
          investment_goal: formData.investment_goal,
          time_horizon: formData.time_horizon,
          rebalance_threshold: formData.rebalance_threshold,
          target_allocation: allocations
        };

        const result = await portfolioService.updatePortfolio(portfolio.id, updateData);
        if (result.success && result.data) {
          onSave(result.data);
        } else {
          setError(result.error || '更新投资组合失败');
        }
      } else {
        const createData: CreatePortfolioData = {
          name: formData.name,
          description: formData.description,
          risk_level: formData.risk_level,
          investment_goal: formData.investment_goal,
          time_horizon: formData.time_horizon,
          initial_amount: formData.initial_amount,
          target_allocation: allocations,
          rebalance_threshold: formData.rebalance_threshold
        };

        const result = await portfolioService.createPortfolio(userId, createData);
        if (result.success && result.data) {
          onSave(result.data);
        } else {
          setError(result.error || '创建投资组合失败');
        }
      }
    } catch (err) {
      setError('操作失败，请重试');
      console.error('投资组合操作失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const addAllocation = () => {
    setAllocations([...allocations, { asset_type: '', target_percentage: 0 }]);
  };

  const removeAllocation = (index: number) => {
    if (allocations.length > 1) {
      setAllocations(allocations.filter((_, i) => i !== index));
    }
  };

  const updateAllocation = (index: number, field: keyof AssetAllocation, value: string | number) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  const getTotalAllocation = (): number => {
    return allocations.reduce((sum, allocation) => sum + allocation.target_percentage, 0);
  };

  const getRiskLevelDescription = (level: string): string => {
    switch (level) {
      case 'conservative':
        return '保守型 - 低风险，稳定收益，适合风险承受能力较低的投资者';
      case 'moderate':
        return '稳健型 - 中等风险，平衡收益，适合大多数投资者';
      case 'aggressive':
        return '激进型 - 高风险，高收益潜力，适合风险承受能力较强的投资者';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditing ? '编辑投资组合' : '创建投资组合'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? '修改投资组合的配置和目标' : '设置您的投资目标和资产配置策略'}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          取消
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 验证错误 */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>设置投资组合的基本信息和投资目标</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">投资组合名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：稳健成长组合"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk_level">风险等级 *</Label>
                <Select
                  value={formData.risk_level}
                  onValueChange={(value: 'conservative' | 'moderate' | 'aggressive') => 
                    setFormData({ ...formData, risk_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">保守型</SelectItem>
                    <SelectItem value="moderate">稳健型</SelectItem>
                    <SelectItem value="aggressive">激进型</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getRiskLevelDescription(formData.risk_level)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述这个投资组合的特点和策略..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investment_goal">投资目标 *</Label>
              <Input
                id="investment_goal"
                value={formData.investment_goal}
                onChange={(e) => setFormData({ ...formData, investment_goal: e.target.value })}
                placeholder="例如：为退休储备资金"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time_horizon">投资期限（年）*</Label>
                <Input
                  id="time_horizon"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.time_horizon}
                  onChange={(e) => setFormData({ ...formData, time_horizon: parseInt(e.target.value) || 5 })}
                  required
                />
              </div>

              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="initial_amount">初始投资金额（元）*</Label>
                  <Input
                    id="initial_amount"
                    type="number"
                    min="1"
                    step="1000"
                    value={formData.initial_amount}
                    onChange={(e) => setFormData({ ...formData, initial_amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="rebalance_threshold">重新平衡阈值（%）*</Label>
                <Input
                  id="rebalance_threshold"
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={formData.rebalance_threshold}
                  onChange={(e) => setFormData({ ...formData, rebalance_threshold: parseFloat(e.target.value) || 5 })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  当资产配置偏离目标超过此阈值时，系统会提醒重新平衡
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 资产配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>资产配置</span>
              <Badge variant={getTotalAllocation() === 100 ? "default" : "destructive"}>
                总计: {getTotalAllocation().toFixed(1)}%
              </Badge>
            </CardTitle>
            <CardDescription>
              设置各类资产的目标配置比例，总和必须为100%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 配置总览 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>配置进度</span>
                <span className={cn(
                  "font-medium",
                  getTotalAllocation() === 100 ? "text-green-600" : "text-red-600"
                )}>
                  {getTotalAllocation().toFixed(1)}% / 100%
                </span>
              </div>
              <Progress 
                value={Math.min(getTotalAllocation(), 100)} 
                className={cn(
                  "h-2",
                  getTotalAllocation() > 100 && "bg-red-100"
                )}
              />
              {getTotalAllocation() !== 100 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {getTotalAllocation() > 100 
                      ? `配置总和超出100%，请调整各项配置比例`
                      : `还需配置 ${(100 - getTotalAllocation()).toFixed(1)}% 的资产`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* 资产配置列表 */}
            <div className="space-y-3">
              {allocations.map((allocation, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>资产类型</Label>
                      <Select
                        value={allocation.asset_type}
                        onValueChange={(value) => updateAllocation(index, 'asset_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择资产类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {type.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>目标配置比例（%）</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={allocation.target_percentage}
                          onChange={(e) => updateAllocation(index, 'target_percentage', parseFloat(e.target.value) || 0)}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAllocation(index)}
                    disabled={allocations.length <= 1}
                    className="shrink-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 添加配置按钮 */}
            <Button
              type="button"
              variant="outline"
              onClick={addAllocation}
              className="w-full"
              disabled={allocations.length >= ASSET_TYPES.length}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加资产配置
            </Button>

            {/* 快速配置模板 */}
            <div className="space-y-2">
              <Label>快速配置模板</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllocations([
                    { asset_type: '股票', target_percentage: 30 },
                    { asset_type: '债券', target_percentage: 50 },
                    { asset_type: '现金', target_percentage: 20 }
                  ])}
                >
                  保守型配置
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllocations([
                    { asset_type: '股票', target_percentage: 60 },
                    { asset_type: '债券', target_percentage: 30 },
                    { asset_type: '现金', target_percentage: 10 }
                  ])}
                >
                  稳健型配置
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllocations([
                    { asset_type: '股票', target_percentage: 80 },
                    { asset_type: '债券', target_percentage: 15 },
                    { asset_type: '现金', target_percentage: 5 }
                  ])}
                >
                  激进型配置
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button 
            type="submit" 
            disabled={loading || getTotalAllocation() !== 100}
            className="flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? '保存修改' : '创建投资组合'}
          </Button>
        </div>
      </form>
    </div>
  );
};
