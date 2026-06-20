'use client';

import { useUserStore } from '@/store';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorLogger } from '@/components/debug/error-logger';
import { SyncStatusComponent } from '@/components/sync/sync-status';
import { usePagePerformance } from '@/hooks/use-performance';
import { logger } from '@/lib/services/error-handler.service';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { VipBadge, VipFeatureBadge } from '@/components/ui/vip-badge';
import { CloudSyncButton } from '@/components/ui/cloud-sync';
import { AppProviders } from '@/components/providers/app-providers';
import { BackgroundSyncManager } from '@/components/sync/global-sync-manager';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Target,
  Settings,
  User,
  LogOut,
  ArrowUpDown,
  BookOpen,
  PieChart,
  Shield,
  Crown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/utils/i18n';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useUserStore();
  const { t } = useI18n();

  // 性能监控
  usePagePerformance('main-layout');

  // 记录布局加载
  logger.info('MainLayout rendered', 'main-layout', {
    pathname,
    userId: user?.id,
    subscription: user?.subscription_type
  });

  const menuItems = [
    {
      title: t('dashboardTitle'),
      icon: LayoutDashboard,
      href: '/dashboard',
      description: t('dashboardDesc')
    },
    {
      title: t('accountsTitle'),
      icon: Wallet,
      href: '/accounts',
      description: t('accountsMenuDesc')
    },
    {
      title: t('transactionsTitle'),
      icon: ArrowUpDown,
      href: '/transactions',
      description: t('transactionsMenuDesc')
    },
    {
      title: t('reviewsTitle'),
      icon: BookOpen,
      href: '/reviews',
      description: t('reviewsMenuDesc')
    },
    {
      title: t('plansTitle'),
      icon: Target,
      href: '/plans',
      description: t('plansMenuDesc')
    },
    {
      title: t('assetsTitle'),
      icon: PieChart,
      href: '/assets',
      description: t('assetsMenuDesc'),
      premium: true
    },

  ];

  // 旗舰版功能菜单项
  const premiumMenuItems = user?.subscription_type === 'flagship' ? [
    {
      title: '系统监控',
      href: '/system-monitor',
      icon: Shield,
      description: '监控系统性能和安全',
      premium: true
    },
  ] : [];

  const bottomMenuItems = [
    {
      title: t('settings'),
      icon: Settings,
      href: '/settings',
    },
    {
      title: t('profile'),
      icon: User,
      href: '/profile',
    },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <AppProviders>
      <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">AssetWise</span>
                <span className="text-xs text-muted-foreground">{t('investmentTool')}</span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="flex flex-col justify-between">
            <div className="flex-1">
              <SidebarMenu className="p-2">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.href}
                      className="w-full justify-start"
                    >
                      <Link href={item.href} className="flex items-center gap-3 p-3">
                        <item.icon className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.title}</span>
                            {item.premium && (
                              <VipFeatureBadge />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {/* 旗舰版功能菜单 */}
                {premiumMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className="w-full justify-start"
                    >
                      <Link href={item.href} className="flex items-center gap-3 p-3">
                        <item.icon className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.title}</span>
                            {item.premium && (
                              <VipFeatureBadge />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>

            <div className="border-t p-2">
              <SidebarMenu>
                {bottomMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href} className="flex items-center gap-3 p-3">
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('logout')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              {user && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium relative ${
                      user.subscription_type !== 'free'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                      {user.subscription_type !== 'free' && (
                        <Crown className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{user.username || '用户'}</span>
                        {user.subscription_type !== 'free' && (
                          <VipBadge subscriptionType={user.subscription_type} variant="icon-only" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <VipBadge subscriptionType={user.subscription_type} variant="compact" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex-1" />

              {/* 云端同步状态 */}
              {user && (
                <div className="flex items-center gap-2">
                  <SyncStatusComponent compact />
                  <CloudSyncButton />
                </div>
              )}

              {/* VIP用户标识 */}
              {user?.subscription_type !== 'free' && user && (
                <div className="flex items-center gap-2">
                  <VipBadge subscriptionType={user.subscription_type} variant="compact" />
                  <span className="text-sm text-muted-foreground">感谢您的支持</span>
                </div>
              )}

              {user?.subscription_type === 'free' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/upgrade">
                    <Crown className="h-4 w-4 mr-2" />
                    升级到专业版
                  </Link>
                </Button>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              <ErrorBoundary context={`page-${pathname}`}>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
      <ErrorLogger />
      <BackgroundSyncManager />
    </SidebarProvider>
    </AppProviders>
  );
}
