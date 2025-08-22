"use client"

import React, { useState } from 'react'
import { 
  Upload, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Info,
  Cloud,
  HardDrive
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { sqliteSyncHelper } from '@/lib/sqlite-sync-helper'

interface LocalDataUploadDialogProps {
  trigger?: React.ReactNode
}

interface SQLiteStatus {
  hasData: boolean
  assetCount: number
  lastUpdate: string
}

interface UploadResult {
  success: boolean
  message: string
  count: number
}

export function LocalDataUploadDialog({ trigger }: LocalDataUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [sqliteStatus, setSQLiteStatus] = useState<SQLiteStatus | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  // 检查SQLite数据库状态
  const checkSQLiteStatus = async () => {
    setIsLoading(true)
    try {
      const status = await sqliteSyncHelper.checkSQLiteStatus()
      setSQLiteStatus(status)
    } catch (error) {
      console.error('检查SQLite状态失败:', error)
      setSQLiteStatus({
        hasData: false,
        assetCount: 0,
        lastUpdate: '检查失败'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 上传本地数据到云端
  const handleUploadData = async () => {
    if (!sqliteStatus?.hasData) {
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResult(null)

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // 执行实际的上传操作
      const result = await sqliteSyncHelper.syncSQLiteToSupabase()
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadResult(result)

      // 如果上传成功，重新检查状态
      if (result.success) {
        setTimeout(() => {
          checkSQLiteStatus()
        }, 1000)
      }

    } catch (error) {
      console.error('上传数据失败:', error)
      setUploadResult({
        success: false,
        message: `上传失败: ${error}`,
        count: 0
      })
    } finally {
      setIsUploading(false)
      setTimeout(() => {
        setUploadProgress(0)
      }, 2000)
    }
  }

  // 对话框打开时检查状态
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      checkSQLiteStatus()
      setUploadResult(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            上传本地数据
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            上传本地数据到云端
          </DialogTitle>
          <DialogDescription>
            将本地SQLite数据库中的资产数据同步到Supabase云端存储
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 本地数据状态 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span className="font-medium">本地数据状态</span>
            </div>
            
            {isLoading ? (
              <div className="flex items-center gap-2 p-4 border rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">检查本地数据库...</span>
              </div>
            ) : sqliteStatus ? (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">数据库状态</span>
                  <Badge variant={sqliteStatus.hasData ? "default" : "secondary"}>
                    {sqliteStatus.hasData ? "有数据" : "无数据"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">资产数量</span>
                  <span className="text-sm font-medium">{sqliteStatus.assetCount} 项</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">最后更新</span>
                  <span className="text-sm text-muted-foreground">{sqliteStatus.lastUpdate}</span>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  无法检查本地数据库状态，请确保应用已正确初始化
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* 上传进度 */}
          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span className="font-medium">上传进度</span>
              </div>
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  正在上传数据到云端... {uploadProgress}%
                </p>
              </div>
            </div>
          )}

          {/* 上传结果 */}
          {uploadResult && (
            <Alert className={uploadResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={uploadResult.success ? "text-green-800" : "text-red-800"}>
                {uploadResult.message}
                {uploadResult.success && uploadResult.count > 0 && (
                  <span className="block mt-1 font-medium">
                    成功上传 {uploadResult.count} 条资产数据
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 操作说明 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">上传说明：</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• 将从本地SQLite数据库读取资产数据</li>
                  <li>• 数据将上传到您的Supabase云端账户</li>
                  <li>• 如果云端已有相同ID的数据，将会被覆盖</li>
                  <li>• 上传过程中请保持网络连接稳定</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              取消
            </Button>
            <Button 
              onClick={handleUploadData}
              disabled={!sqliteStatus?.hasData || isUploading || isLoading}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  开始上传
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}