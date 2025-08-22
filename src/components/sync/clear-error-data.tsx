'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';

export function ClearErrorData() {
  const clearAllErrorData = () => {
    try {
      // 清除错误恢复服务的数据
      localStorage.removeItem('assetwise_sync_errors');
      
      // 清除其他相关的存储数据
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('error') || 
          key.includes('sync') || 
          key.startsWith('temp_') ||
          key.includes('assetwise')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        console.log('清除存储键:', key);
        localStorage.removeItem(key);
      });
      
      // 刷新页面以重新加载干净的状态
      window.location.reload();
    } catch (error) {
      console.error('清除数据时出错:', error);
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50">
      <Button
        onClick={clearAllErrorData}
        size="sm"
        className="bg-red-600 hover:bg-red-700 text-white shadow-lg border-0 font-medium"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        清除错误数据
      </Button>
    </div>
  );
}