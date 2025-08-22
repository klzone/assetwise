'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Check,
  Trash2,
  Clock
} from 'lucide-react';
import { notificationService, Notification } from '@/lib/services/notification.service';

interface NotificationCenterProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function NotificationCenter({ className, isOpen = false, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleRemove = (id: string) => {
    notificationService.remove(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clear();
  };

  const handleActionClick = (action: () => void, notificationId: string) => {
    action();
    handleMarkAsRead(notificationId);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    return true;
  });

  const unreadCount = notificationService.getUnreadCount();

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 通知面板 */}
      <div className="absolute right-4 top-4 bottom-4 w-96 max-w-[calc(100vw-2rem)]">
        <Card className="h-full bg-slate-900/95 backdrop-blur-md border-white/10 text-white flex flex-col">
          <CardHeader className="border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-blue-400" />
                <span>通知中心</span>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* 筛选和操作按钮 */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={filter === 'all' ? 'default' : 'outline'}
                  className={filter === 'all' ? 'bg-blue-600' : 'bg-white/10 border-white/20 text-white'}
                  onClick={() => setFilter('all')}
                >
                  全部 ({notifications.length})
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  className={filter === 'unread' ? 'bg-blue-600' : 'bg-white/10 border-white/20 text-white'}
                  onClick={() => setFilter('unread')}
                >
                  未读 ({unreadCount})
                </Button>
              </div>
              
              <div className="flex space-x-1">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white"
                    onClick={handleMarkAllAsRead}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    全部已读
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white"
                  onClick={handleClearAll}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  清空
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Bell className="w-12 h-12 mb-2 opacity-50" />
                  <p>没有通知</p>
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all ${
                        notification.read 
                          ? 'bg-white/5 border-white/10 opacity-75' 
                          : `${getNotificationBgColor(notification.type)} shadow-lg`
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-white mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-300 mb-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {notification.timestamp.toLocaleString()}
                                </span>
                                {!notification.read && (
                                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                    新
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex space-x-1 ml-2">
                              {!notification.read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-400 hover:text-white p-1"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-red-400 p-1"
                                onClick={() => handleRemove(notification.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* 操作按钮 */}
                          {notification.actions && notification.actions.length > 0 && (
                            <div className="flex space-x-2 mt-3">
                              {notification.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant={action.style === 'primary' ? 'default' : 'outline'}
                                  className={
                                    action.style === 'primary' 
                                      ? 'bg-blue-600 hover:bg-blue-700' 
                                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                  }
                                  onClick={() => handleActionClick(action.action, notification.id)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}