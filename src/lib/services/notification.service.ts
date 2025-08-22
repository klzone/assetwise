'use client';

export interface NotificationOptions {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

export interface Notification extends NotificationOptions {
  id: string;
  timestamp: Date;
  read: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined') {
      this.requestPermission();
      this.loadNotifications();
    }
  }

  private async requestPermission(): Promise<void> {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }
  }

  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('sync_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem('sync_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('保存通知失败:', error);
    }
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  public subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.notifications]);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public notify(options: NotificationOptions): string {
    const notification: Notification = {
      ...options,
      id: this.generateId(),
      timestamp: new Date(),
      read: false,
      duration: options.duration || 5000
    };

    this.notifications.unshift(notification);
    this.saveNotifications();
    this.notifyListeners();

    // 显示浏览器通知
    this.showBrowserNotification(notification);

    // 自动移除非持久化通知
    if (!options.persistent && notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  private showBrowserNotification(notification: Notification): void {
    if (this.permission === 'granted' && 'Notification' in window) {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.persistent
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        this.markAsRead(notification.id);
      };

      // 自动关闭浏览器通知
      if (!notification.persistent) {
        setTimeout(() => {
          browserNotification.close();
        }, notification.duration || 5000);
      }
    }
  }

  public remove(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  public markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  public markAllAsRead(): void {
    let hasChanges = false;
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  public clear(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // 同步相关的通知方法
  public notifySyncSuccess(itemCount: number, duration: number): string {
    return this.notify({
      title: '同步成功',
      message: `已成功同步 ${itemCount} 个项目，耗时 ${duration.toFixed(1)} 秒`,
      type: 'success',
      duration: 3000
    });
  }

  public notifySyncError(error: string): string {
    return this.notify({
      title: '同步失败',
      message: error,
      type: 'error',
      persistent: true,
      actions: [
        {
          label: '重试',
          action: () => {
            // 这里会调用同步服务的重试方法
            console.log('重试同步');
          },
          style: 'primary'
        },
        {
          label: '查看详情',
          action: () => {
            // 这里会打开同步历史页面
            console.log('查看同步详情');
          },
          style: 'secondary'
        }
      ]
    });
  }

  public notifySyncConflict(conflictCount: number): string {
    return this.notify({
      title: '发现数据冲突',
      message: `检测到 ${conflictCount} 个数据冲突，需要手动解决`,
      type: 'warning',
      persistent: true,
      actions: [
        {
          label: '解决冲突',
          action: () => {
            // 这里会打开冲突解决界面
            console.log('打开冲突解决界面');
          },
          style: 'primary'
        }
      ]
    });
  }

  public notifySyncStarted(): string {
    return this.notify({
      title: '开始同步',
      message: '正在同步数据到云端...',
      type: 'info',
      duration: 2000
    });
  }

  public notifyNetworkError(): string {
    return this.notify({
      title: '网络连接异常',
      message: '无法连接到同步服务器，将在网络恢复后自动重试',
      type: 'warning',
      duration: 5000
    });
  }

  public notifyStorageQuotaExceeded(): string {
    return this.notify({
      title: '存储空间不足',
      message: '云端存储空间已满，请升级订阅或清理数据',
      type: 'error',
      persistent: true,
      actions: [
        {
          label: '升级订阅',
          action: () => {
            // 这里会跳转到订阅页面
            console.log('跳转到订阅页面');
          },
          style: 'primary'
        },
        {
          label: '清理数据',
          action: () => {
            // 这里会打开数据清理界面
            console.log('打开数据清理界面');
          },
          style: 'secondary'
        }
      ]
    });
  }
}

export const notificationService = new NotificationService();