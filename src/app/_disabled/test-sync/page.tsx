'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Play, TestTube, FileText } from 'lucide-react'
import { syncFixTester } from '@/lib/test-sync-fix'
import { syncIssuesFixer } from '@/lib/scripts/fix-sync-issues'
import { SyncFixPanel } from '@/components/sync/sync-fix-panel'

export default function TestSyncPage() {
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const [isExecutingFix, setIsExecutingFix] = useState(false)
  const [fixResults, setFixResults] = useState<any>(null)

  // 运行测试
  const runTest = async () => {
    setIsRunningTest(true)
    setTestResults([])
    
    // 重定向console.log到结果显示
    const originalLog = console.log
    const logs: string[] = []
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      logs.push(message)
      setTestResults([...logs])
      originalLog(...args)
    }
    
    try {
      await syncFixTester.runFullTest()
      logs.push('\n✅ 测试完成！所有功能正常工作。')
      setTestResults([...logs])
    } catch (error) {
      logs.push(`\n❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setTestResults([...logs])
    } finally {
      console.log = originalLog
      setIsRunningTest(false)
    }
  }

  // 执行修复
  const executeFix = async () => {
    setIsExecutingFix(true)
    setFixResults(null)
    
    try {
      const result = await syncIssuesFixer.executeFullFix()
      setFixResults(result)
    } catch (error) {
      setFixResults({
        success: false,
        message: `修复失败: ${error instanceof Error ? error.message : '未知错误'}`,
        steps: []
      })
    } finally {
      setIsExecutingFix(false)
    }
  }

  // 清除结果
  const clearResults = () => {
    setTestResults([])
    setFixResults(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">AssetWise 同步修复测试</h1>
        <p className="text-gray-600">测试和修复数据同步问题</p>
      </div>

      {/* 快速操作按钮 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            选择要执行的操作
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={runTest}
              disabled={isRunningTest}
              className="flex items-center gap-2"
            >
              {isRunningTest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              运行完整测试
            </Button>
            
            <Button 
              onClick={executeFix}
              disabled={isExecutingFix}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isExecutingFix ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              执行数据修复
            </Button>
            
            <Button 
              onClick={clearResults}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              清除结果
            </Button>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>使用说明:</strong>
              <br />• <strong>运行完整测试</strong>: 检查Supabase连接、诊断数据状态、验证修复功能
              <br />• <strong>执行数据修复</strong>: 自动修复发现的数据同步问题
              <br />• 建议先运行测试，确认有问题后再执行修复
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 测试结果 */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 修复结果 */}
      {fixResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {fixResults.success ? '✅' : '❌'} 修复结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={fixResults.success ? "default" : "destructive"}>
              <AlertDescription>{fixResults.message}</AlertDescription>
            </Alert>

            {fixResults.steps && fixResults.steps.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">修复步骤详情:</h4>
                {fixResults.steps.map((step: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={step.success ? 'text-green-600' : 'text-red-600'}>
                        {step.success ? '✅' : '❌'}
                      </span>
                      <span className="font-medium">{step.step}</span>
                    </div>
                    <div className="text-sm text-gray-600 ml-6">
                      {step.message}
                    </div>
                    {step.details && (
                      <div className="text-xs text-gray-500 ml-6 mt-1">
                        <pre>{JSON.stringify(step.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 修复工具面板 */}
      <Card>
        <CardHeader>
          <CardTitle>修复工具面板</CardTitle>
          <CardDescription>
            用户友好的修复界面
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SyncFixPanel />
        </CardContent>
      </Card>

      {/* 控制台命令 */}
      <Card>
        <CardHeader>
          <CardTitle>控制台命令</CardTitle>
          <CardDescription>
            在浏览器控制台中可以直接使用的命令
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <div className="text-gray-600">// 运行完整测试</div>
            <div>testSyncFix()</div>
          </div>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <div className="text-gray-600">// 快速诊断</div>
            <div>await syncIssuesFixer.quickDiagnosis()</div>
          </div>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <div className="text-gray-600">// 执行修复</div>
            <div>await syncIssuesFixer.executeFullFix()</div>
          </div>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <div className="text-gray-600">// 验证同步结果</div>
            <div>await assetSyncFixService.validateSyncResult()</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}