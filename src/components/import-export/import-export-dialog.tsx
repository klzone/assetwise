'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useUserStore } from '@/store';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  duplicates: number;
}

export function ImportExportDialog() {
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>('');
  const [exportTypes, setExportTypes] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  // 处理导入
  const handleImport = async () => {
    if (!importFile || !importType || !user) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('dataType', importType);
      formData.append('userId', (user.id || 0).toString());

      const response = await fetch('/api/import-export', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        // 刷新页面数据
        window.location.reload();
      }
    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        errors: ['导入失败，请稍后重试'],
        duplicates: 0
      });
    } finally {
      setImporting(false);
    }
  };

  // 处理导出
  const handleExport = async () => {
    if (exportTypes.length === 0 || !user) return;

    setExporting(true);
    try {
      const response = await fetch(
        `/api/import-export?userId=${user.id}&dataTypes=${exportTypes.join(',')}`
      );

      const data = await response.json();

      // 为每种数据类型生成CSV文件
      if (data.accounts && exportTypes.includes('accounts')) {
        generateCSVDownload(data.accounts, 'accounts', [
          'name', 'type', 'broker', 'currency', 'balance', 'created_at'
        ]);
      }

      if (data.transactions && exportTypes.includes('transactions')) {
        generateCSVDownload(data.transactions, 'transactions', [
          'account_id', 'type', 'symbol', 'quantity', 'price', 'amount', 'fee', 'tax', 'notes', 'transaction_date'
        ]);
      }

      if (data.reviews && exportTypes.includes('reviews')) {
        generateCSVDownload(data.reviews, 'reviews', [
          'review_date', 'content', 'emotion', 'market_view', 'lessons_learned', 'next_actions'
        ]);
      }

      if (data.plans && exportTypes.includes('plans')) {
        generateCSVDownload(data.plans, 'investment_plans', [
          'title', 'description', 'target_amount', 'current_amount', 'target_date', 'status', 'risk_level', 'category'
        ]);
      }

    } catch (error) {
      alert('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  // 生成CSV下载
  const generateCSVDownload = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 切换导出类型
  const toggleExportType = (type: string) => {
    setExportTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          数据管理
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>数据导入导出</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">数据导入</TabsTrigger>
            <TabsTrigger value="export">数据导出</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  导入数据
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">选择数据类型</label>
                  <Select value={importType} onValueChange={setImportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择要导入的数据类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accounts">账户信息</SelectItem>
                      <SelectItem value="transactions">交易记录</SelectItem>
                      <SelectItem value="reviews">复盘日志</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">选择CSV文件</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {importFile && (
                  <div className="text-sm text-gray-600">
                    已选择文件: {importFile.name}
                  </div>
                )}

                <Button 
                  onClick={handleImport}
                  disabled={!importFile || !importType || importing}
                  className="w-full"
                >
                  {importing ? '导入中...' : '开始导入'}
                </Button>

                {importResult && (
                  <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {importResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {importResult.success ? '导入成功' : '导入失败'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>成功导入: {importResult.imported} 条记录</div>
                      <div>重复跳过: {importResult.duplicates} 条记录</div>
                      {importResult.errors.length > 0 && (
                        <div>
                          <div className="font-medium text-red-600">错误信息:</div>
                          <ul className="list-disc list-inside">
                            {importResult.errors.map((error, index) => (
                              <li key={index} className="text-red-600">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  导出数据
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">选择要导出的数据</label>
                  <div className="space-y-2">
                    {[
                      { key: 'accounts', label: '账户信息' },
                      { key: 'transactions', label: '交易记录' },
                      { key: 'reviews', label: '复盘日志' },
                      { key: 'plans', label: '投资计划' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={exportTypes.includes(key)}
                          onChange={() => toggleExportType(key)}
                          className="rounded border-gray-300"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleExport}
                  disabled={exportTypes.length === 0 || exporting}
                  className="w-full"
                >
                  {exporting ? '导出中...' : '开始导出'}
                </Button>

                <div className="text-sm text-gray-600">
                  <p>• 数据将以CSV格式导出</p>
                  <p>• 可以选择多种数据类型同时导出</p>
                  <p>• 导出的文件可以重新导入到系统中</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
