"use client"

import React, { useState } from 'react'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database,
  Key,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PageTransition, CardEnterAnimation, FadeInAnimation } from '@/components/ui/page-transition'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // 用户设置状态
  const [userSettings, setUserSettings] = useState({
    // 个人信息
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '+86 138 0013 8000',
    avatar: '',
    bio: '专业投资者，专注于科技股和成长股投资',
    
    // 通知设置
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    priceAlerts: true,
    newsAlerts: true,
    portfolioUpdates: true,
    
    // 安全设置
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
    
    // 显示设置
    language: 'zh-CN',
    currency: 'CNY',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'comma',
    
    // 数据设置
    dataRetention: '2years',
    autoBackup: true,
    exportFormat: 'excel'
  })

  const handleSettingChange = (key: string, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* 页面标题区域 */}
        <FadeInAnimation delay={0}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">设置</h1>
              <p className="text-muted-foreground mt-2">
                系统设置与个人偏好
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="glass-effect">
                <RefreshCw className="h-4 w-4 mr-2" />
                重置设置
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary-hover">
                <Save className="h-4 w-4 mr-2" />
                保存更改
              </Button>
            </div>
          </div>
        </FadeInAnimation>

        {/* 设置标签页 */}
        <CardEnterAnimation delay={100}>
          <Card className="modern-card">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    个人信息
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    通知设置
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    安全设置
                  </TabsTrigger>
                  <TabsTrigger value="display" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    显示设置
                  </TabsTrigger>
                  <TabsTrigger value="data" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    数据管理
                  </TabsTrigger>
                </TabsList>

                {/* 个人信息设置 */}
                <TabsContent value="profile" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <Card className="modern-card">
                        <CardHeader>
                          <CardTitle className="text-lg">头像设置</CardTitle>
                          <CardDescription>上传您的个人头像</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-col items-center space-y-4">
                            <Avatar className="w-24 h-24">
                              <AvatarImage src={userSettings.avatar} />
                              <AvatarFallback className="text-2xl">
                                {userSettings.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Upload className="h-4 w-4 mr-2" />
                                上传
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="lg:col-span-2">
                      <Card className="modern-card">
                        <CardHeader>
                          <CardTitle className="text-lg">基本信息</CardTitle>
                          <CardDescription>管理您的个人基本信息</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">姓名</Label>
                              <Input
                                id="name"
                                value={userSettings.name}
                                onChange={(e) => handleSettingChange('name', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">邮箱地址</Label>
                              <Input
                                id="email"
                                type="email"
                                value={userSettings.email}
                                onChange={(e) => handleSettingChange('email', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">手机号码</Label>
                            <Input
                              id="phone"
                              value={userSettings.phone}
                              onChange={(e) => handleSettingChange('phone', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bio">个人简介</Label>
                            <textarea
                              id="bio"
                              className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                              value={userSettings.bio}
                              onChange={(e) => handleSettingChange('bio', e.target.value)}
                              placeholder="介绍一下您的投资经验和偏好..."
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* 通知设置 */}
                <TabsContent value="notifications" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="modern-card">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bell className="h-5 w-5" />
                          通知设置
                        </CardTitle>
                        <CardDescription>管理您接收通知的方式</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>邮件通知</Label>
                              <p className="text-sm text-muted-foreground">
                                接收重要更新和提醒邮件
                              </p>
                            </div>
                            <Switch
                              checked={userSettings.emailNotifications}
                              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>推送通知</Label>
                              <p className="text-sm text-muted-foreground">
                                浏览器推送通知
                              </p>
                            </div>
                            <Switch
                              checked={userSettings.pushNotifications}
                              onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>短信通知</Label>
                              <p className="text-sm text-muted-foreground">
                                重要安全提醒短信
                              </p>
                            </div>
                            <Switch
                              checked={userSettings.smsNotifications}
                              onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="modern-card">
                      <CardHeader>
                        <CardTitle className="text-lg">通知类型</CardTitle>
                        <CardDescription>选择您希望接收的通知类型</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>价格提醒</Label>
                              <p className="text-sm text-muted-foreground">
                                资产价格变动提醒
                              </p>
                            </div>
                            <Switch
                              checked={userSettings.priceAlerts}
                              onCheckedChange={(checked) => handleSettingChange('priceAlerts', checked)}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>新闻提醒</Label>
                              <p className="text-sm text-muted-foreground">
                                相关市场新闻推送
                              </p>
                            </div>
                            <Switch
                              checked={userSettings.newsAlerts}
                              onCheckedChange={(checked) => handleSettingChange('newsAlerts', checked)}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>投资组合更新</Label>
                              <p className="text-sm text-muted-foreground">
                                投资组合变化通知
                              </p>
                            </div>
                            <Switch
                              checked={userSettings.portfolioUpdates}
                              onCheckedChange={(checked) => handleSettingChange('portfolioUpdates', checked)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* 安全设置 */}
                <TabsContent value="security" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="modern-card">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          账户安全
                        </CardTitle>
                        <CardDescription>保护您的账户安全</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">当前密码</Label>
                            <div className="relative">
                              <Input
                                id="current-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="输入当前密码"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-password">新密码</Label>
                            <Input
                              id="new-password"
                              type="password"
                              placeholder="输入新密码"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">确认新密码</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="再次输入新密码"
                            />
                          </div>
                          <Button className="w-full">
                            <Lock className="h-4 w-4 mr-2" />
                            更新密码
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="modern-card">
                      <CardHeader>
                        <CardTitle className="text-lg">安全选项</CardTitle>
                        <CardDescription>额外的安全保护措施</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>双因素认证</Label>
                              <p className="text-sm text-muted-foreground">
                                使用手机验证码增强安全性
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {userSettings.twoFactorAuth && (
                                <Badge variant="secondary">已启用</Badge>
                              )}
                              <Switch
                                checked={userSettings.twoFactorAuth}
                                onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                              />
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>登录提醒</Label>
                              <p className="text-sm text-muted-foreground">
                                新设备登录时发送提醒
                              </p>
                            </div>
                            <Switch
                              checked={userSettings.loginAlerts}
                              onCheckedChange={(checked) => handleSettingChange('loginAlerts', checked)}
                            />
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <Label>会话超时</Label>
                            <Select
                              value={userSettings.sessionTimeout}
                              onValueChange={(value) => handleSettingChange('sessionTimeout', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15分钟</SelectItem>
                                <SelectItem value="30">30分钟</SelectItem>
                                <SelectItem value="60">1小时</SelectItem>
                                <SelectItem value="240">4小时</SelectItem>
                                <SelectItem value="never">永不超时</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* 显示设置 */}
                <TabsContent value="display" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="modern-card">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Palette className="h-5 w-5" />
                          外观设置
                        </CardTitle>
                        <CardDescription>个性化您的界面外观</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>主题模式</Label>
                            <Select value={theme} onValueChange={setTheme}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">浅色模式</SelectItem>
                                <SelectItem value="dark">深色模式</SelectItem>
                                <SelectItem value="system">跟随系统</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>语言设置</Label>
                            <Select
                              value={userSettings.language}
                              onValueChange={(value) => handleSettingChange('language', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="zh-CN">简体中文</SelectItem>
                                <SelectItem value="zh-TW">繁体中文</SelectItem>
                                <SelectItem value="en-US">English</SelectItem>
                                <SelectItem value="ja-JP">日本語</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>货币单位</Label>
                            <Select
                              value={userSettings.currency}
                              onValueChange={(value) => handleSettingChange('currency', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CNY">人民币 (¥)</SelectItem>
                                <SelectItem value="USD">美元 ($)</SelectItem>
                                <SelectItem value="EUR">欧元 (€)</SelectItem>
                                <SelectItem value="JPY">日元 (¥)</SelectItem>
                                <SelectItem value="HKD">港币 (HK$)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="modern-card">
                      <CardHeader>
                        <CardTitle className="text-lg">格式设置</CardTitle>
                        <CardDescription>数据显示格式偏好</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>日期格式</Label>
                            <Select
                              value={userSettings.dateFormat}
                              onValueChange={(value) => handleSettingChange('dateFormat', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="YYYY-MM-DD">2024-01-15</SelectItem>
                                <SelectItem value="MM/DD/YYYY">01/15/2024</SelectItem>
                                <SelectItem value="DD/MM/YYYY">15/01/2024</SelectItem>
                                <SelectItem value="YYYY年MM月DD日">2024年01月15日</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>数字格式</Label>
                            <Select
                              value={userSettings.numberFormat}
                              onValueChange={(value) => handleSettingChange('numberFormat', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="comma">1,234,567.89</SelectItem>
                                <SelectItem value="space">1 234 567.89</SelectItem>
                                <SelectItem value="none">1234567.89</SelectItem>
                                <SelectItem value="chinese">123万4567.89</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* 数据管理 */}
                <TabsContent value="data" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="modern-card">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          数据管理
                        </CardTitle>
                        <CardDescription>管理您的数据存储和备份</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>数据保留期</Label>
                            <Select
                              value={userSettings.dataRetention}
                              onValueChange={(value) => handleSettingChange('dataRetention', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1year">1年</SelectItem>
                                <SelectItem value="2years">2年</SelectItem>
                                <SelectItem value="5years">5年</SelectItem>
                                <SelectItem value="forever">永久保留</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>自动备份</Label>
                              <p className="text-sm text-muted-foreground">
                                定期自动备份您的数据
                              </p>
                            </div>
                            <Switch
                              checked={userSettings.autoBackup}
                              onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>导出格式</Label>
                            <Select
                              value={userSettings.exportFormat}
                              onValueChange={(value) => handleSettingChange('exportFormat', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                <SelectItem value="csv">CSV (.csv)</SelectItem>
                                <SelectItem value="json">JSON (.json)</SelectItem>
                                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="modern-card">
                      <CardHeader>
                        <CardTitle className="text-lg">数据操作</CardTitle>
                        <CardDescription>导入导出和清理数据</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <Button className="w-full" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            导出所有数据
                          </Button>
                          <Button className="w-full" variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            导入数据
                          </Button>
                          <Separator />
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              危险操作
                            </div>
                            <Button className="w-full" variant="destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              清空所有数据
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              此操作将永久删除所有数据，无法恢复
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </CardEnterAnimation>
      </div>
    </PageTransition>
  )
}