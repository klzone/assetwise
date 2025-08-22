'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Zap, 
  Settings, 
  History, 
  AlertTriangle, 
  Shield,
  HelpCircle,
  ExternalLink,
  Download,
  Search,
  ChevronRight,
  Clock,
  Users,
  Smartphone,
  Wifi,
  Database,
  RefreshCw
} from 'lucide-react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const quickStartSteps = [
    {
      icon: <Settings className="w-5 h-5" />,
      title: '启用同步',
      description: '在设置中开启数据同步功能',
      action: '前往设置',
      link: '/sync-settings'
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: '选择频率',
      description: '设置自动同步的时间间隔',
      action: '配置同步',
      link: '/sync-settings'
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: '首次同步',
      description: '完成初始数据上传到云端',
      action: '开始同步',
      link: '/sync-settings'
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: '多设备访问',
      description: '在其他设备上登录并同步数据',
      action: '了解更多',
      link: '/help'
    }
  ];

  const faqItems = [
    {
      question: '同步需要多长时间？',
      answer: '取决于数据量和网络速度，通常几秒到几分钟不等。首次同步可能需要更长时间。',
      category: '基础'
    },
    {
      question: '同步会消耗多少流量？',
      answer: '系统使用增量同步和数据压缩技术，通常每次同步只需要几KB到几MB的流量。',
      category: '网络'
    },
    {
      question: '可以在离线状态下使用吗？',
      answer: '可以。离线时所有修改会保存在本地，网络恢复后自动同步。',
      category: '基础'
    },
    {
      question: '数据安全如何保障？',
      answer: '所有数据传输使用HTTPS加密，云端存储采用企业级安全标准。',
      category: '安全'
    },
    {
      question: '如何取消同步？',
      answer: '在同步设置中点击"禁用同步"，本地数据不会受影响。',
      category: '设置'
    },
    {
      question: '同步失败怎么办？',
      answer: '系统会自动重试，如持续失败请检查网络连接或联系技术支持。',
      category: '故障'
    }
  ];

  const features = [
    {
      icon: <RefreshCw className="w-6 h-6 text-blue-400" />,
      title: '自动同步',
      description: '定时自动同步本地数据到云端，支持多种同步频率设置'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-green-400" />,
      title: '跨设备访问',
      description: '在任何设备上访问最新数据，实现无缝的多设备体验'
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      title: '权限控制',
      description: '基于订阅级别的功能访问控制，保障数据安全'
    },
    {
      icon: <History className="w-6 h-6 text-amber-400" />,
      title: '版本历史',
      description: '完整的数据变更历史记录，支持版本回滚功能'
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
      title: '冲突解决',
      description: '智能处理数据冲突，提供多种解决策略'
    },
    {
      icon: <Shield className="w-6 h-6 text-cyan-400" />,
      title: '错误恢复',
      description: '自动错误检测和恢复机制，确保同步稳定性'
    }
  ];

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 页面标题 */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">帮助中心</h1>
              <p className="text-gray-300">AssetWise 数据同步功能使用指南</p>
            </div>
          </div>
          
          {/* 搜索框 */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索帮助内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <Tabs defaultValue="quick-start" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="quick-start" className="data-[state=active]:bg-slate-700/50 text-white">
              快速开始
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-slate-700/50 text-white">
              功能介绍
            </TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-slate-700/50 text-white">
              常见问题
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-slate-700/50 text-white">
              高级功能
            </TabsTrigger>
          </TabsList>

          {/* 快速开始标签页 */}
          <TabsContent value="quick-start" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span>5分钟快速设置</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickStartSteps.map((step, index) => (
                      <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-blue-600/20 rounded-lg flex-shrink-0">
                            {step.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-white mb-1">{step.title}</h3>
                            <p className="text-xs text-gray-300 mb-3">{step.description}</p>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-xs"
                              onClick={() => window.location.href = step.link}
                            >
                              {step.action}
                              <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 重要提示 */}
              <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-md border-blue-500/30 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-600/30 rounded-lg">
                      <HelpCircle className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">开始使用前请注意</h3>
                      <ul className="space-y-1 text-sm text-blue-100">
                        <li>• 确保您有稳定的网络连接</li>
                        <li>• 首次同步可能需要几分钟时间</li>
                        <li>• 建议在WiFi环境下进行首次同步</li>
                        <li>• 同步过程中请保持应用运行</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 功能介绍标签页 */}
          <TabsContent value="features" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-slate-800/50 rounded-lg">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-300">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 功能访问链接 */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-white mb-4">快速访问</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => window.location.href = '/sync-settings'}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      同步设置
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => window.location.href = '/version-history'}
                    >
                      <History className="w-4 h-4 mr-2" />
                      版本历史
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => window.location.href = '/conflict-resolution'}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      冲突解决
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => window.location.href = '/error-recovery-test'}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      错误恢复
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-white mb-4">文档资源</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      完整用户指南
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载PDF指南
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      用户社区
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 常见问题标签页 */}
          <TabsContent value="faq" className="mt-6">
            <div className="space-y-4">
              {filteredFAQ.length === 0 ? (
                <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
                  <CardContent className="p-8 text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-gray-400">没有找到匹配的问题</p>
                  </CardContent>
                </Card>
              ) : (
                filteredFAQ.map((item, index) => (
                  <Card key={index} className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-medium text-white">{item.question}</h3>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-gray-300">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* 高级功能标签页 */}
          <TabsContent value="advanced" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
                <CardHeader>
                  <CardTitle>高级同步设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-2">性能优化</h4>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• 批量同步：合并多个小变更</li>
                        <li>• 智能调度：根据网络状况调整频率</li>
                        <li>• 缓存机制：减少重复数据传输</li>
                        <li>• 压缩算法：最小化传输数据量</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-2">开发者选项</h4>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• 详细日志：查看详细同步日志</li>
                        <li>• API调试：监控API调用情况</li>
                        <li>• 性能分析：分析同步性能指标</li>
                        <li>• 手动触发：手动触发各种同步操作</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
                <CardHeader>
                  <CardTitle>数据管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出数据
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      导入数据
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重置同步
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 联系支持 */}
        <Card className="mt-8 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-md border-purple-500/30 text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-600/30 rounded-lg">
                <HelpCircle className="w-5 h-5 text-purple-300" />
              </div>
              <h3 className="text-lg font-medium text-white">需要更多帮助？</h3>
            </div>
            <p className="text-purple-100 mb-4">
              如果您在使用过程中遇到问题，我们的技术支持团队随时为您提供帮助。
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Users className="w-4 h-4 mr-2" />
                联系支持
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <BookOpen className="w-4 h-4 mr-2" />
                查看文档
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ExternalLink className="w-4 h-4 mr-2" />
                用户论坛
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}