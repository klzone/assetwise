'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Download,
  AlertTriangle
} from 'lucide-react';
import { syncIntegrationTest, TestSuite, TestResult } from '@/lib/tests/sync-integration-test';

export function SyncTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);

  // 运行测试套件
  const runTests = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setTestLogs([]);
    setTestSuite(null);

    try {
      // 模拟测试进度更新
      const testNames = [
        '数据库连接测试',
        '基本数据同步测试', 
        '离线数据队列测试',
        '数据冲突解决测试',
        '实时同步测试',
        '数据一致性检查测试',
        '错误处理测试',
        '性能压力测试',
        '网络中断恢复测试',
        '大数据量同步测试'
      ];

      // 监听测试进度
      let completedTests = 0;
      const updateProgress = (testName: string) => {
        setCurrentTest(testName);
        setTestLogs(prev => [...prev, `开始运行: ${testName}`]);
        completedTests++;
        setProgress((completedTests / testNames.length) * 100);
      };

      // 模拟逐个运行测试
      for (const testName of testNames) {
        updateProgress(testName);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟测试时间
      }

      // 运行实际测试
      const result = await syncIntegrationTest.runAllTests();
      setTestSuite(result);
      setTestLogs(prev => [...prev, '所有测试完成']);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setTestLogs(prev => [...prev, `测试运行失败: ${errorMessage}`]);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  }, []);

  // 停止测试
  const stopTests = useCallback(() => {
    setIsRunning(false);
    setCurrentTest('');
    setTestLogs(prev => [...prev, '测试已停止']);
  }, []);

  // 重置测试
  const resetTests = useCallback(() => {
    setTestSuite(null);
    setTestLogs([]);
    setProgress(0);
    setCurrentTest('');
  }, []);

  // 下载测试报告
  const downloadReport = useCallback(() => {
    if (!testSuite) return;

    const report = syncIntegrationTest.generateReport(testSuite);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-test-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [testSuite]);

  // 获取测试状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'fail': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'skip': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  // 获取测试状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4" />;
      case 'fail': return <XCircle className="w-4 h-4" />;
      case 'skip': return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">集成测试运行器</CardTitle>
            <div className="flex space-x-2">
              {!isRunning ? (
                <Button
                  onClick={runTests}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  运行测试
                </Button>
              ) : (
                <Button
                  onClick={stopTests}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="w-4 h-4 mr-2" />
                  停止测试
                </Button>
              )}
              <Button
                onClick={resetTests}
                variant="outline"
                className="bg-white/10 border-white/20 text-white"
                disabled={isRunning}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
              {testSuite && (
                <Button
                  onClick={downloadReport}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载报告
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">测试进度</span>
              <span className="text-white">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {currentTest && (
              <p className="text-sm text-blue-400">当前测试: {currentTest}</p>
            )}
          </div>

          {/* 测试概览 */}
          {testSuite && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{testSuite.totalTests}</p>
                  <p className="text-sm text-gray-400">总测试数</p>
                </div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{testSuite.passedTests}</p>
                  <p className="text-sm text-gray-400">通过</p>
                </div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{testSuite.failedTests}</p>
                  <p className="text-sm text-gray-400">失败</p>
                </div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {((testSuite.passedTests / testSuite.totalTests) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-400">成功率</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 测试结果 */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList className="bg-slate-800 border-white/10">
          <TabsTrigger value="results" className="data-[state=active]:bg-slate-700">
            测试结果
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700">
            运行日志
          </TabsTrigger>
          <TabsTrigger value="report" className="data-[state=active]:bg-slate-700">
            测试报告
          </TabsTrigger>
        </TabsList>

        {/* 测试结果标签页 */}
        <TabsContent value="results">
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">测试结果详情</CardTitle>
            </CardHeader>
            <CardContent>
              {testSuite ? (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {testSuite.tests.map((test, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(test.status)}
                            <h4 className="font-medium">{test.testName}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="border-current">
                              {test.status}
                            </Badge>
                            <span className="text-sm opacity-70">
                              {test.duration}ms
                            </span>
                          </div>
                        </div>
                        <p className="text-sm opacity-80">{test.message}</p>
                        {test.details && (
                          <details className="mt-2">
                            <summary className="text-sm cursor-pointer opacity-70">
                              查看详情
                            </summary>
                            <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-x-auto">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">暂无测试结果</p>
                  <p className="text-sm text-gray-500 mt-1">点击"运行测试"开始测试</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 运行日志标签页 */}
        <TabsContent value="logs">
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">运行日志</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {testLogs.length > 0 ? (
                    testLogs.map((log, index) => (
                      <div
                        key={index}
                        className="text-sm font-mono text-gray-300 py-1 px-2 hover:bg-slate-800/50 rounded"
                      >
                        <span className="text-gray-500 mr-2">
                          [{new Date().toLocaleTimeString()}]
                        </span>
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">暂无运行日志</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 测试报告标签页 */}
        <TabsContent value="report">
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">测试报告</CardTitle>
            </CardHeader>
            <CardContent>
              {testSuite ? (
                <ScrollArea className="h-96">
                  <div className="prose prose-invert max-w-none">
                    <pre className="text-sm whitespace-pre-wrap text-gray-300">
                      {syncIntegrationTest.generateReport(testSuite)}
                    </pre>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">暂无测试报告</p>
                  <p className="text-sm text-gray-500 mt-1">完成测试后将生成详细报告</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}