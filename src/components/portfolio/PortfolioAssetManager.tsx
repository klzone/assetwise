'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PlusIcon, 
  MinusIcon, 
  EditIcon, 
  TrashIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon
} from 'lucide-react';
import { Portfolio, PortfolioAsset } from '@/lib/types/portfolio.types';
import { Asset } from '@/lib/types/data.types';
import { PortfolioService } from '@/lib/services/portfolio.service';

interface PortfolioAssetManagerProps {
  portfolio: Portfolio;
  assets: Asset[];
  onUpdate: () => void;
}

interface AddAssetFormData {
  asset_id: string;
  quantity: number;
  current_price: number;
  target_percentage: number;
}

export function PortfolioAssetManager({ portfolio, assets, onUpdate }: PortfolioAssetManagerProps) {
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PortfolioAsset | null>(null);
  const [formData, setFormData] = useState<AddAssetFormData>({
    asset_id: '',
    quantity: 0,
    current_price: 0,
    target_percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const portfolioService = new PortfolioService();

  useEffect(() => {
    loadPortfolioAssets();
  }, [portfolio.id]);

  const loadPortfolioAssets = async () => {
    try {
      const assets = await portfolioService.getPortfolioAssets(portfolio.id);
      setPortfolioAssets(assets);
    } catch (error) {
      console.error('加载投资组合资产失败:', error);
      setError('加载资产数据失败');
    }
  };

  const handleAddAsset = async () => {
    if (!formData.asset_id || formData.quantity <= 0 || formData.current_price <= 0) {
      setError('请填写完整的资产信息');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await portfolioService.addAssetToPortfolio(portfolio.id, {
        asset_id: formData.asset_id,
        quantity: formData.quantity,
        current_price: formData.current_price,
        target_percentage: formData.target_percentage
      });

      if (result.success) {
        await loadPortfolioAssets();
        onUpdate();
        setShowAddDialog(false);
        resetForm();
      } else {
        setError(result.error || '添加资产失败');
      }
    } catch (error) {
      console.error('添加资产失败:', error);
      setError('添加资产失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAsset = async (assetId: string) => {
    try {
      setLoading(true);
      const result = await portfolioService.removeAssetFromPortfolio(portfolio.id, assetId);
      
      if (result.success) {
        await loadPortfolioAssets();
        onUpdate();
      } else {
        setError(result.error || '移除资产失败');
      }
    } catch (error) {
      console.error('移除资产失败:', error);
      setError('移除资产失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAsset = (asset: PortfolioAsset) => {
    setEditingAsset(asset);
    setFormData({
      asset_id: asset.asset_id,
      quantity: asset.quantity,
      current_price: asset.current_price,
      target_percentage: asset.target_percentage
    });
    setShowEditDialog(true);
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;

    try {
      setLoading(true);
      setError(null);

      // 先移除旧资产，再添加新资产（简化的更新逻辑）
      await portfolioService.removeAssetFromPortfolio(portfolio.id, editingAsset.asset_id);
      
      const result = await portfolioService.addAssetToPortfolio(portfolio.id, {
        asset_id: formData.asset_id,
        quantity: formData.quantity,
        current_price: formData.current_price,
        target_percentage: formData.target_percentage
      });

      if (result.success) {
        await loadPortfolioAssets();
        onUpdate();
        setShowEditDialog(false);
        setEditingAsset(null);
        resetForm();
      } else {
        setError(result.error || '更新资产失败');
      }
    } catch (error) {
      console.error('更新资产失败:', error);
      setError('更新资产失败');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      asset_id: '',
      quantity: 0,
      current_price: 0,
      target_percentage: 0
    });
    setError(null);
  };

  const getAssetInfo = (assetId: string) => {
    return assets.find(asset => asset.id === assetId);
  };

  const calculateTotalValue = () => {
    return portfolioAssets.reduce((sum, asset) => sum + asset.current_value, 0);
  };

  const getAvailableAssets = () => {
    const usedAssetIds = portfolioAssets.map(pa => pa.asset_id);
    return assets.filter(asset => !usedAssetIds.includes(asset.id));
  };

  return (
    <div className="space-y-6">
      {/* 资产概览 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>投资组合资产</CardTitle>
              <CardDescription>管理投资组合中的具体资产配置</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} disabled={getAvailableAssets().length === 0}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加资产
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {portfolioAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PlusIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>还没有添加任何资产</p>
              <p className="text-sm">点击上方按钮开始添加资产到投资组合</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 资产列表 */}
              {portfolioAssets.map((portfolioAsset) => {
                const assetInfo = getAssetInfo(portfolioAsset.asset_id);
                const weightPercentage = portfolio.total_value > 0 ? 
                  (portfolioAsset.current_value / portfolio.total_value) * 100 : 0;

                return (
                  <div key={portfolioAsset.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{assetInfo?.name || '未知资产'}</h4>
                          <Badge variant="outline">{assetInfo?.symbol}</Badge>
                          <Badge variant={assetInfo?.asset_type === 'stock' ? 'default' : 
                                        assetInfo?.asset_type === 'bond' ? 'secondary' : 'outline'}>
                            {assetInfo?.asset_type === 'stock' ? '股票' :
                             assetInfo?.asset_type === 'bond' ? '债券' :
                             assetInfo?.asset_type === 'fund' ? '基金' :
                             assetInfo?.asset_type === 'crypto' ? '加密货币' : '其他'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{assetInfo?.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAsset(portfolioAsset)}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAsset(portfolioAsset.asset_id)}
                          disabled={loading}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">持有数量：</span>
                        <div className="font-medium">{portfolioAsset.quantity.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">当前价格：</span>
                        <div className="font-medium">¥{portfolioAsset.current_price.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">总价值：</span>
                        <div className="font-medium">¥{portfolioAsset.current_value.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">权重占比：</span>
                        <div className="font-medium">{weightPercentage.toFixed(2)}%</div>
                      </div>
                    </div>

                    {/* 收益信息 */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">目标配置：</span>
                        <span className="text-sm font-medium">{portfolioAsset.target_percentage.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">配置偏差：</span>
                        <span className={`text-sm font-medium ${
                          Math.abs(weightPercentage - portfolioAsset.target_percentage) > portfolio.rebalance_threshold
                            ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {weightPercentage > portfolioAsset.target_percentage ? '+' : ''}
                          {(weightPercentage - portfolioAsset.target_percentage).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 总计信息 */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">资产总价值：</span>
                  <span className="text-lg font-bold">¥{calculateTotalValue().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">资产数量：</span>
                  <span className="text-sm font-medium">{portfolioAssets.length} 项</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加资产对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加资产到投资组合</DialogTitle>
            <DialogDescription>
              选择资产并设置持有数量和目标配置比例
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="asset">选择资产</Label>
              <Select value={formData.asset_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, asset_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="请选择资产" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableAssets().map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      <div className="flex items-center space-x-2">
                        <span>{asset.name}</span>
                        <Badge variant="outline">{asset.symbol}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">持有数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    quantity: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price">当前价格</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.current_price}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    current_price: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="target">目标配置比例 (%)</Label>
              <Input
                id="target"
                type="number"
                value={formData.target_percentage}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  target_percentage: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0.00"
                max="100"
                min="0"
              />
            </div>

            {formData.quantity > 0 && formData.current_price > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">总价值：</span>
                  <span className="font-medium ml-2">
                    ¥{(formData.quantity * formData.current_price).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              resetForm();
            }}>
              取消
            </Button>
            <Button onClick={handleAddAsset} disabled={loading}>
              {loading ? '添加中...' : '添加资产'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑资产对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑资产配置</DialogTitle>
            <DialogDescription>
              修改资产的持有数量、价格和目标配置
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>资产信息</Label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">
                  {editingAsset && getAssetInfo(editingAsset.asset_id)?.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {editingAsset && getAssetInfo(editingAsset.asset_id)?.symbol}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-quantity">持有数量</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    quantity: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-price">当前价格</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.current_price}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    current_price: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-target">目标配置比例 (%)</Label>
              <Input
                id="edit-target"
                type="number"
                value={formData.target_percentage}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  target_percentage: parseFloat(e.target.value) || 0 
                }))}
                max="100"
                min="0"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">更新后总价值：</span>
                <span className="font-medium ml-2">
                  ¥{(formData.quantity * formData.current_price).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditingAsset(null);
              resetForm();
            }}>
              取消
            </Button>
            <Button onClick={handleUpdateAsset} disabled={loading}>
              {loading ? '更新中...' : '更新资产'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}