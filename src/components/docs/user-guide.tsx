'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Play, 
  Settings, 
  HelpCircle, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Download,
  Search,
  Clock,
  Shield,
  Zap,
  Database,
  Wifi,
  Users,
  Lock,
  RefreshCw,
  FileText,
  Video,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Target,
  Wrench
} from 'lucide-react';

interface UserGuideProps {
  className?: string;
}

interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface TroubleshootingItem {
  id: string;
  problem: string;
  symptoms: string[];
  solutions: string[];
  severity: 'low' | 'medium' | 'high';
}

export function UserGuide({ className }: UserGuideProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [expandedTrouble, setExpandedTrouble] = useState<string | null>(null);

  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: '快速开始',
      description: '了解如何设置和开始使用数据同步功能',
      icon: <Play className="w-5 h-5" />,
      difficulty: 'beginner',
      estimatedTime: '5分钟',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">欢迎使用AssetWise数据同步</h4>
            <p className="text-gray-300 text-sm">
              AssetWise提供强大的数据同步功能，让您的资产数据在所有设备间保持同步。
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <div>
                <h5 className="text-white font-medium">登录您的账户</h5>
                <p className="text-gray-400 text-sm">使用您的AssetWise账户登录，确保拥有同步权限。</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <div>
                <h5 className="text-white font-medium">配置同步设置</h5>
                <p className="text-gray-400 text-sm">前往"同步设置"页面，配置您的同步偏好和计划。</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <div>
                <h5 className="text-white font-medium">开始同步</h5>
                <p className="text-gray-400 text-sm">点击"立即同步"按钮或等待自动同步开始。</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300 font-medium">提示</span>
            </div>
            <p className="text-gray-300 text-sm">
              首次同步可能需要较长时间，请保持网络连接稳定。
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'sync-settings',
      title: '同步设置详解',
      description: '深入了解各种同步设置选项和最佳实践',
      icon: <Settings className="w-5 h-5" />,
      difficulty: 'intermediate',
      estimatedTime: '10分钟',
      content: (
        <div className="space-y-4">
          <h4 className="text-white font-medium">同步模式</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
              <h5 className="text-white font-medium mb-2">自动同步</h5>
              <p className="text-gray-400 text-sm mb-3">
                系统会根据设定的时间间隔自动执行同步操作。
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">推荐间隔:</span>
                  <span className="text-white">15-30分钟</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">适用场景:</span>
                  <span className="text-white">日常使用</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
              <h5 className="text-white font-medium mb-2">手动同步</h5>
              <p className="text-gray-400 text-sm mb-3">
                需要用户主动触发同步操作，提供更多控制权。
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">触发方式:</span>
                  <span className="text-white">按钮点击</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">适用场景:</span>
                  <span className="text-white">精确控制</span>
                </div>
              </div>
            </div>
          </div>
          
          <h4 className="text-white font-medium">高级设置</h4>
          <div className="space-y-3">
            <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">冲突解决策略</span>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">重要</Badge>
              </div>
              <p className="text-gray-400 text-xs">
                当检测到数据冲突时，系统将根据您选择的策略自动处理。
              </p>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">网络优化</span>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">推荐</Badge>
              </div>
              <p className="text-gray-400 text-xs">
                启用网络优化可以减少数据传输量，提高同步效率。
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'conflict-resolution',
      title: '冲突解决指南',
      description: '学习如何处理和解决数据同步冲突',
      icon: <AlertTriangle className="w-5 h-5" />,
      difficulty: 'intermediate',
      estimatedTime: '8分钟',
      content: (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <h4 className="text-amber-300 font-medium mb-2">什么是数据冲突？</h4>
            <p className="text-gray-300 text-sm">
              当同一数据在不同设备上被同时修改时，系统无法自动确定哪个版本是正确的，就会产生数据冲突。
            </p>
          </div>
          
          <h4 className="text-white font-medium">常见冲突类型</h4>
          <div className="space-y-3">
            <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-white text-sm font-medium">同时修改冲突</span>
              </div>
              <p className="text-gray-400 text-xs">
                同一记录在多个设备上同时被修改，产生不同的版本。
              </p>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span className="text-white text-sm font-medium">删除-修改冲突</span>
              </div>
              <p className="text-gray-400 text-xs">
                一个设备删除了记录，而另一个设备修改了同一记录。
              </p>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-white text-sm font-medium">创建冲突</span>
              </div>
              <p className="text-gray-400 text-xs">
                多个设备创建了具有相同标识符的记录。
              </p>
            </div>
          </div>
          
          <h4 className="text-white font-medium">解决策略</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="text-white text-sm font-medium">自动解决</h5>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• 使用最新版本</li>
                <li>• 使用本地版本</li>
                <li>• 使用远程版本</li>
                <li>• 智能合并</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-white text-sm font-medium">手动解决</h5>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• 逐字段比较</li>
                <li>• 自定义合并</li>
                <li>• 保留两个版本</li>
                <li>• 回滚到历史版本</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'performance-optimization',
      title: '性能优化建议',
      description: '提高同步性能和效率的最佳实践',
      icon: <Zap className="w-5 h-5" />,
      difficulty: 'advanced',
      estimatedTime: '12分钟',
      content: (
        <div className="space-y-4">
          <h4 className="text-white font-medium">网络优化</h4>
          <div className="space-y-3">
            <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
              <h5 className="text-white text-sm font-medium mb-2">选择合适的同步时间</h5>
              <p className="text-gray-400 text-xs mb-2">
                避免在网络高峰期进行大量数据同步，建议在以下时间段进行：
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• 早晨 6:00-8:00</li>
                <li>• 中午 12:00-14:00</li>
                <li>• 晚上 22:00-24:00</li>
              </ul>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
              <h5 className="text-white text-sm font-medium mb-2">数据压缩</h5>
              <p className="text-gray-400 text-xs">
                启用数据压缩可以减少传输时间，特别是在慢速网络环境下效果显著。
              </p>
            </div>
          </div>
          
          <h4 className="text-white font-medium">存储优化</h4>
          <div className="space-y-3">
            <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
              <h5 className="text-white text-sm font-medium mb-2">定期清理</h5>
              <p className="text-gray-400 text-xs mb-2">
                定期清理以下内容以释放存储空间：
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• 过期的同步日志</li>
                <li>• 临时文件和缓存</li>
                <li>• 旧版本的备份数据</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="w-4 h-4 text-green-400" />
              <span className="text-green-300 font-medium">专业提示</span>
            </div>
            <p className="text-gray-300 text-sm">
              监控同步性能指标，如传输速度、错误率和完成时间，有助于及时发现和解决性能问题。
            </p>
          </div>
        </div>
      )
    }
  ];

  const faqs: FAQ[] = [
    {
      id: 'sync-frequency',
      question: '同步频率应该设置为多少？',
      answer: '推荐的同步频率取决于您的使用场景：\n• 轻度使用：每小时同步一次\n• 中度使用：每30分钟同步一次\n• 重度使用：每15分钟同步一次\n• 实时协作：每5分钟同步一次\n\n过于频繁的同步可能会影响设备性能和网络带宽。',
      category: '设置',
      tags: ['同步', '频率', '性能']
    },
    {
      id: 'offline-sync',
      question: '离线时的数据会如何处理？',
      answer: '当设备离线时：\n• 所有数据修改会被保存在本地队列中\n• 重新连接网络后会自动开始同步\n• 系统会智能处理离线期间的数据冲突\n• 您可以在同步历史中查看离线期间的所有变更',
      category: '同步',
      tags: ['离线', '网络', '数据']
    },
    {
      id: 'data-security',
      question: '我的数据在同步过程中是否安全？',
      answer: 'AssetWise采用多层安全措施保护您的数据：\n• 端到端加密传输\n• 服务器端数据加密存储\n• 定期安全审计和漏洞扫描\n• 符合GDPR和其他数据保护法规\n• 您可以随时导出或删除您的数据',
      category: '安全',
      tags: ['安全', '加密', '隐私']
    },
    {
      id: 'storage-limit',
      question: '同步数据有存储限制吗？',
      answer: '存储限制根据您的订阅计划而定：\n• 免费版：1GB存储空间\n• 专业版：10GB存储空间\n• 企业版：100GB存储空间\n• 自定义版：无限存储空间\n\n您可以在账户设置中查看当前使用情况。',
      category: '存储',
      tags: ['存储', '限制', '订阅']
    },
    {
      id: 'multiple-devices',
      question: '可以在多少台设备上使用同步功能？',
      answer: '设备数量限制根据订阅计划而定：\n• 免费版：最多2台设备\n• 专业版：最多5台设备\n• 企业版：最多20台设备\n• 自定义版：无限设备\n\n每台设备都会显示在设备管理页面中。',
      category: '设备',
      tags: ['设备', '限制', '多设备']
    }
  ];

  const troubleshooting: TroubleshootingItem[] = [
    {
      id: 'sync-stuck',
      problem: '同步卡住不动',
      symptoms: [
        '同步进度条长时间不变',
        '显示"同步中"但没有进展',
        '网络连接正常但同步失败'
      ],
      solutions: [
        '检查网络连接稳定性',
        '重启应用程序',
        '清除同步缓存',
        '检查服务器状态',
        '联系技术支持'
      ],
      severity: 'medium'
    },
    {
      id: 'data-missing',
      problem: '数据丢失或不完整',
      symptoms: [
        '某些记录在同步后消失',
        '数据内容不完整',
        '最近的修改没有同步'
      ],
      solutions: [
        '检查同步历史记录',
        '从版本历史中恢复数据',
        '检查冲突解决设置',
        '验证网络传输完整性',
        '从备份中恢复数据'
      ],
      severity: 'high'
    },
    {
      id: 'slow-sync',
      problem: '同步速度很慢',
      symptoms: [
        '同步时间比平时长很多',
        '大文件传输缓慢',
        '频繁出现超时错误'
      ],
      solutions: [
        '检查网络带宽',
        '启用数据压缩',
        '调整同步批次大小',
        '避开网络高峰期',
        '优化本地存储'
      ],
      severity: 'low'
    },
    {
      id: 'auth-error',
      problem: '认证失败',
      symptoms: [
        '提示"认证令牌过期"',
        '无法连接到服务器',
        '登录状态异常'
      ],
      solutions: [
        '重新登录账户',
        '检查账户状态',
        '清除认证缓存',
        '更新应用程序',
        '检查系统时间设置'
      ],
      severity: 'medium'
    }
  ];

  const categories = ['all', '设置', '同步', '安全', '存储', '设备'];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'intermediate': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初级';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return '未知';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-amber-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 搜索和筛选 */}
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索文档内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }
                >
                  {category === 'all' ? '全部' : category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容 */}
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>用户指南与帮助文档</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="guides" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
              <TabsTrigger value="guides" className="data-[state=active]:bg-slate-700/50 text-white">
                使用指南
              </TabsTrigger>
              <TabsTrigger value="faq" className="data-[state=active]:bg-slate-700/50 text-white">
                常见问题
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="data-[state=active]:bg-slate-700/50 text-white">
                故障排除
              </TabsTrigger>
            </TabsList>
            
            {/* 使用指南标签页 */}
            <TabsContent value="guides" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guideSections.map((section) => (
                  <Card key={section.id} className="bg-slate-800/30 border-white/10 text-white hover:border-white/20 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-600/20 rounded-lg">
                            {section.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{section.title}</CardTitle>
                            <p className="text-sm text-gray-400 mt-1">{section.description}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-3">
                        <Badge className={getDifficultyColor(section.difficulty)}>
                          {getDifficultyText(section.difficulty)}
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{section.estimatedTime}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {section.content}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 常见问题标签页 */}
            <TabsContent value="faq" className="mt-6">
              <div className="space-y-4">
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>没有找到匹配的问题</p>
                  </div>
                ) : (
                  filteredFAQs.map((faq) => (
                    <div key={faq.id} className="bg-slate-800/30 rounded-lg border border-white/10">
                      <button
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      >
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{faq.question}</h4>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                              {faq.category}
                            </Badge>
                            {faq.tags.map(tag => (
                              <Badge key={tag} className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {expandedFAQ === faq.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {expandedFAQ === faq.id && (
                        <div className="px-4 pb-4 border-t border-white/10">
                          <div className="pt-4">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                              {faq.answer}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* 故障排除标签页 */}
            <TabsContent value="troubleshooting" className="mt-6">
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 font-medium">故障排除指南</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    遇到问题时，请按照以下步骤进行排查。如果问题仍然存在，请联系技术支持。
                  </p>
                </div>
                
                {troubleshooting.map((item) => (
                  <div key={item.id} className="bg-slate-800/30 rounded-lg border border-white/10">
                    <button
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedTrouble(expandedTrouble === item.id ? null : item.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className={`w-4 h-4 ${getSeverityColor(item.severity)}`} />
                          <h4 className="text-white font-medium">{item.problem}</h4>
                        </div>
                        <p className="text-sm text-gray-400">
                          {item.symptoms.length} 个症状 • {item.solutions.length} 个解决方案
                        </p>
                      </div>
                      {expandedTrouble === item.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedTrouble === item.id && (
                      <div className="px-4 pb-4 border-t border-white/10">
                        <div className="pt-4 space-y-4">
                          <div>
                            <h5 className="text-white font-medium mb-2">症状表现</h5>
                            <ul className="space-y-1">
                              {item.symptoms.map((symptom, index) => (
                                <li key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                                  <div className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{symptom}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="text-white font-medium mb-2">解决方案</h5>
                            <ol className="space-y-2">
                              {item.solutions.map((solution, index) => (
                                <li key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                                    {index + 1}
                                  </div>
                                  <span>{solution}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 快速链接和资源 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Video className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium">视频教程</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              观看详细的视频教程，快速掌握同步功能的使用方法。
            </p>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full">
              <ExternalLink className="w-3 h-3 mr-1" />
              观看教程
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <h3 className="font-medium">在线支持</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              遇到问题？我们的技术支持团队随时为您提供帮助。
            </p>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full">
              <MessageCircle className="w-3 h-3 mr-1" />
              联系支持
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Download className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium">下载资源</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              下载用户手册、配置模板和其他有用的资源文件。
            </p>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 w-full">
              <Download className="w-3 h-3 mr-1" />
              下载资源
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
