"use client"

import React from 'react'
import { AlertTriangle, Trash2, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AssetData } from './asset-card'

interface DeleteConfirmationDialogProps {
  asset: AssetData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSoftDelete: (id: string) => void
  onPermanentDelete: (id: string) => void
}

export function DeleteConfirmationDialog({
  asset,
  open,
  onOpenChange,
  onSoftDelete,
  onPermanentDelete
}: DeleteConfirmationDialogProps) {
  if (!asset) return null

  const handleSoftDelete = () => {
    onSoftDelete(asset.id)
    onOpenChange(false)
  }

  const handlePermanentDelete = () => {
    if (confirm('确定要永久删除这个资产吗？此操作无法撤销！')) {
      onPermanentDelete(asset.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            删除资产确认
          </DialogTitle>
          <DialogDescription>
            您即将删除资产 <strong>{asset.name}</strong> ({asset.symbol})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              请选择删除方式。软删除可以通过云端同步恢复，永久删除将无法恢复。
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Archive className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">软删除（推荐）</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                标记资产为已删除状态，不会立即从云端删除。如果误删，可以通过云端同步恢复。
              </p>
              <Button 
                variant="outline" 
                onClick={handleSoftDelete}
                className="w-full"
              >
                <Archive className="h-4 w-4 mr-2" />
                软删除
              </Button>
            </div>

            <div className="p-4 border rounded-lg border-destructive/20">
              <div className="flex items-center gap-3 mb-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <h4 className="font-medium text-destructive">永久删除</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                立即删除资产和相关交易记录，此操作无法撤销。
              </p>
              <Button 
                variant="destructive" 
                onClick={handlePermanentDelete}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                永久删除
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}