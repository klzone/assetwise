"use client"

import React, { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { assetStorage } from '@/lib/asset-storage'
import { Transaction, TransactionType } from '@/lib/transaction-types'
import { useLocale } from '@/contexts/locale-context'

interface TransactionHistoryProps {
  assetId: string
}

export function TransactionHistory({ assetId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const { formatCurrency } = useLocale()

  useEffect(() => {
    // 获取该资产的所有交易记录
    const assetTransactions = assetStorage.getAssetTransactions(assetId)
    // 按时间倒序排列
    const sortedTransactions = assetTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setTransactions(sortedTransactions)
  }, [assetId])

  const getTransactionIcon = (type: TransactionType) => {
    return type === TransactionType.BUY ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-red-600" />
    )
  }

  const getTransactionBadge = (type: TransactionType) => {
    return type === TransactionType.BUY ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        买入
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">
        卖出
      </Badge>
    )
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          交易记录
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getTransactionBadge(transaction.type)}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.quantity.toLocaleString()} 股 @ {formatCurrency(transaction.price)}
                    </p>
                    {transaction.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        备注: {transaction.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === TransactionType.BUY 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {transaction.type === TransactionType.BUY ? '-' : '+'}
                    {formatCurrency(transaction.totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">暂无交易记录</p>
            <p className="text-sm text-muted-foreground mt-1">
              买入或卖出资产后，交易记录将显示在这里
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}