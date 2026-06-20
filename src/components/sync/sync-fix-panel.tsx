'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, CheckCircle, RefreshCw, Search } from 'lucide-react'
import { syncIssuesFixer } from '@/lib/scripts/fix-sync-issues'

interface DiagnosisResult {
  hasIssues: boolean
  issues: string[]
  recommendations: string[]
  localAssets: number
  cloudAssets: number
}

interface FixResult {
  success: boolean
  message: string
  steps: Array<{
    step: string
    success: boolean
    message: string
    details?: any
  }>
}

export function SyncFixPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [fixResult, setFixResult] = useState<FixResult | null>(null)
  const [showReport, setShowReport] = useState(false)

  // 执行快速诊断
  const handleQuickDiagnosis = async () => {
    setIsLoading(true)
    setDiagnosis(null)
    setFixResult(null)
    
    try {
      console.log('🔍 开始快速诊断...')
      const result = await syncIssuesFixer.quickDiagnosis()
      setDiagnosis(result)
      console.log('✅ 诊断完成:', result)
    } catch (error) {
      console.error('❌ 诊断失败:', error)
      setDiagnosis({
        hasIssues: true,
        issues: [`诊断失败: ${error instanceof Error ? error.message : '未知错误'}`],
        recommendations: ['请检查网络连接和用户登录状态'],
        localAssets: 0,
        cloudAssets: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 执行完整修复
  const handleFullFix = async () => {
    setIsLoading(true)
    setFixResult(null)
    
    try {
      console.log('🔧 开始执行完整修复...')
      const result = await syncIssuesFixer.executeFullFix()
      setFixResult(result)
      console.log('✅ 修复完成:', result)
      
      // 修复完成后重新诊断
      setTimeout(() => {
        handleQuickDiagnosis()
      }, 1000)
    } catch (error) {
      console.error('❌ 修复失败:', error)
      setFixResult({
        success: false,
        message: `修复失败: ${error instanceof Error ? error.message : '未知错误'}`,
        steps: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 生成并显示报告
  const handleShowReport = () => {
    if (fixResult) {
      const report = syncIssuesFixer.generateFixReport(fixResult)
      console.log('📋 修复报告:\n', report)
      setShowReport(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题和说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            数据同步修复工具
          </CardTitle>
          <CardDescription>
            检测并修复本地资产状态与云端数据不一致的问题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={handleQuickDiagnosis}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              快速诊断
            </Button>
            
            <Button 
              onClick={handleFullFix}
              disabled={isLoading || !diagnosis?.hasIssues}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              执行修复
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 诊断结果 */}
      {diagnosis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {diagnosis.hasIssues ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              诊断结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 数据统计 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {diagnosis.localAssets}
                </div>
                <div className="text-sm text-blue-600">本地资产</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {diagnosis.cloudAssets}
                </div>
                <div className="text-sm text-purple-600">云端资产</div>
              </div>
            </div>

            {/* 问题列表 */}
            {diagnosis.hasIssues ? (
              <div className="space-y-3">
                <h4 className="font-medium text-red-600">发现的问题:</h4>
                {diagnosis.issues.map((issue, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{issue}</AlertDescription>
                  </Alert>
                ))}
                
                <h4 className="font-medium text-blue-600">建议操作:</h4>
                <div className="space-y-2">
                  {diagnosis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ 数据状态正常，本地与云端保持一致
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 修复结果 */}
      {fixResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {fixResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              修复结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={fixResult.success ? "default" : "destructive"}>
              <AlertDescription>{fixResult.message}</AlertDescription>
            </Alert>

            {/* 修复步骤 */}
            <div className="space-y-3">
              <h4 className="font-medium">修复步骤:</h4>
              {fixResult.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.step}</div>
                    <div className="text-sm text-gray-600">{step.message}</div>
                    {step.details && (
                      <div className="text-xs text-gray-500 mt-1">
                        {step.details.local && (
                          <span>本地: {step.details.local.count} | </span>
                        )}
                        {step.details.cloud && (
                          <span>云端: {step.details.cloud.count} | </span>
                        )}
                        {step.details.deleted !== undefined && (
                          <span>删除: {step.details.deleted} | </span>
                        )}
                        {step.details.synced !== undefined && (
                          <span>同步: {step.details.synced}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 生成报告按钮 */}
            <Button 
              onClick={handleShowReport}
              variant="outline"
              size="sm"
            >
              生成详细报告
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. <strong>快速诊断</strong>: 检查本地和云端数据的一致性，识别潜在问题</p>
          <p>2. <strong>执行修复</strong>: 自动修复发现的同步问题，确保数据一致性</p>
          <p>3. <strong>修复内容</strong>: 清理已删除资产、同步本地更改、去重交易记录</p>
          <p>4. <strong>注意事项</strong>: 修复过程会以本地数据为准，确保本地数据正确后再执行</p>
        </CardContent>
      </Card>
    </div>
  )
}