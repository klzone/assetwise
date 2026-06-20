/**
 * UI/UX优化演示页面
 * 展示所有新的UI组件、动画效果和无障碍功能
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Heart,
  Download,
  Settings,
  Palette,
  Zap,
  Shield,
  Accessibility,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { ThemeManagerProvider, useThemeManager, ThemePreview, ThemeCustomizer } from '@/lib/ui/theme-manager';
import {
  AnimatedContainer,
  PageTransition,
  ScrollTriggeredAnimation,
  MouseTrackingCard,
  CountingNumber,
  MagneticButton,
  RippleEffect,
  HoverTooltip,
  SkeletonLoader,
  AnimatedProgressBar,
  ParticleBackground,
} from '@/lib/ui/animations';
import {
  AccessibilityProvider,
  useAccessibility,
  SkipLink,
  FocusTrap,
  AccessibilitySettings,
  ScreenReaderOnly,
} from '@/lib/ui/accessibility';
import {
  EnhancedButton,
  SmartCard,
  EnhancedInput,
  SmartSelect,
  ProgressIndicator,
} from '@/components/ui/enhanced';

// 主演示组件
function UIShowcaseContent() {
  const [activeTab, setActiveTab] = useState('themes');
  const [currentStep, setCurrentStep] = useState('step1');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(65);

  const { announce } = useAccessibility();
  const { availableThemes, currentTheme, applyTheme } = useThemeManager();

  const tabs = [
    { id: 'themes', label: '主题系统', icon: Palette },
    { id: 'animations', label: '动画效果', icon: Sparkles },
    { id: 'components', label: '组件库', icon: Wand2 },
    { id: 'accessibility', label: '无障碍', icon: Accessibility },
    { id: 'interactions', label: '交互效果', icon: Zap },
  ];

  const progressSteps = [
    { id: 'step1', title: '基本信息', description: '填写用户基本信息' },
    { id: 'step2', title: '偏好设置', description: '配置个人偏好' },
    { id: 'step3', title: '安全设置', description: '设置安全选项' },
    { id: 'step4', title: '完成', description: '确认并提交' },
  ];

  const categoryOptions = [
    { value: 'stocks', label: '股票投资' },
    { value: 'crypto', label: '数字货币' },
    { value: 'funds', label: '基金理财' },
    { value: 'bonds', label: '债券投资' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    announce(`切换到${tabs.find(t => t.id === tabId)?.label}标签`);
  };

  const handleStepClick = (stepId: string) => {
    setCurrentStep(stepId);
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <PageTransition className="min-h-screen bg-background">
      <SkipLink />
      
      {/* 粒子背景 */}
      <div className="fixed inset-0 pointer-events-none">
        <ParticleBackground particleCount={30} />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* 页面标题 */}
        <AnimatedContainer animation="slideDown" className="text-center mb-12">
          <motion.h1 
            className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            animate={{ backgroundPosition: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
          >
            AssetWise UI/UX 优化展示
          </motion.h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            体验全新的用户界面设计、动画效果和无障碍功能
          </p>
        </AnimatedContainer>

        {/* 统计数据 */}
        <ScrollTriggeredAnimation animation="slideUp" className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: '主题预设', value: 8, icon: Palette },
              { label: '动画组件', value: 15, icon: Sparkles },
              { label: 'UI组件', value: 25, icon: Wand2 },
              { label: '无障碍特性', value: 12, icon: Accessibility },
            ].map((stat, index) => (
              <SmartCard key={stat.label} hover glow className="p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                >
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl font-bold mb-2">
                    <CountingNumber value={stat.value} duration={1.5} />
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              </SmartCard>
            ))}
          </div>
        </ScrollTriggeredAnimation>

        {/* 选项卡导航 */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id 
                    ? 'bg-background shadow-sm text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="space-y-8">
          {/* 主题系统 */}
          {activeTab === 'themes' && (
            <AnimatedContainer animation="fadeIn" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">主题系统</h2>
                <p className="text-muted-foreground mb-6">
                  选择预设主题或自定义您的专属配色方案
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {availableThemes.map((theme) => (
                  <ThemePreview
                    key={theme.id}
                    theme={theme}
                    isActive={currentTheme.id === theme.id}
                    onSelect={() => applyTheme(theme.id)}
                  />
                ))}
              </div>

              <SmartCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">主题定制器</h3>
                <ThemeCustomizer />
              </SmartCard>
            </AnimatedContainer>
          )}

          {/* 动画效果 */}
          {activeTab === 'animations' && (
            <AnimatedContainer animation="slideLeft" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">动画效果</h2>
                <p className="text-muted-foreground mb-6">
                  丰富的动画组件和微交互效果
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 鼠标跟踪卡片 */}
                <MouseTrackingCard className="p-6 bg-card border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">鼠标跟踪效果</h3>
                  <p className="text-muted-foreground">移动鼠标查看光影效果</p>
                </MouseTrackingCard>

                {/* 磁性按钮 */}
                <SmartCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">磁性按钮</h3>
                  <div className="flex space-x-4">
                    <MagneticButton
                      strength={0.3}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                    >
                      磁性效果
                    </MagneticButton>
                    <HoverTooltip content="这是一个提示信息">
                      <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
                        悬浮提示
                      </button>
                    </HoverTooltip>
                  </div>
                </SmartCard>

                {/* 进度条动画 */}
                <SmartCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">进度动画</h3>
                  <AnimatedProgressBar
                    progress={progress}
                    showPercentage
                    className="mb-4"
                  />
                  <button
                    onClick={() => setProgress(Math.random() * 100)}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-md text-sm"
                  >
                    随机进度
                  </button>
                </SmartCard>

                {/* 骨架屏 */}
                <SmartCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">加载骨架屏</h3>
                  <div className="space-y-3">
                    <SkeletonLoader height="1.5rem" />
                    <SkeletonLoader height="1rem" width="80%" />
                    <SkeletonLoader height="1rem" width="60%" />
                  </div>
                </SmartCard>
              </div>
            </AnimatedContainer>
          )}

          {/* 组件库 */}
          {activeTab === 'components' && (
            <AnimatedContainer animation="slideRight" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">增强组件库</h2>
                <p className="text-muted-foreground mb-6">
                  现代化的UI组件，支持丰富的交互和自定义选项
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 增强按钮 */}
                <SmartCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">增强按钮</h3>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <EnhancedButton variant="default" icon={<Star className="h-4 w-4" />}>
                        默认按钮
                      </EnhancedButton>
                      <EnhancedButton variant="gradient" loading={loading} onClick={simulateLoading}>
                        渐变按钮
                      </EnhancedButton>
                      <EnhancedButton variant="outline" magnetic icon={<Heart className="h-4 w-4" />}>
                        磁性按钮
                      </EnhancedButton>
                    </div>
                  </div>
                </SmartCard>

                {/* 智能表单 */}
                <SmartCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">智能表单</h3>
                  <div className="space-y-4">
                    <EnhancedInput
                      label="用户名"
                      placeholder="请输入用户名"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      clearable
                    />
                    <EnhancedInput
                      type="email"
                      label="邮箱地址"
                      placeholder="请输入邮箱"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      helper="我们不会分享您的邮箱地址"
                    />
                    <SmartSelect
                      placeholder="选择投资类别"
                      options={categoryOptions}
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value})}
                      searchable
                    />
                  </div>
                </SmartCard>

                {/* 进度指示器 */}
                <SmartCard className="p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">进度指示器</h3>
                  <div className="space-y-6">
                    <ProgressIndicator
                      steps={progressSteps}
                      currentStep={currentStep}
                      completedSteps={completedSteps}
                      onStepClick={handleStepClick}
                      orientation="horizontal"
                    />
                    <ProgressIndicator
                      steps={progressSteps.slice(0, 3)}
                      currentStep={currentStep}
                      completedSteps={completedSteps}
                      onStepClick={handleStepClick}
                      orientation="vertical"
                    />
                  </div>
                </SmartCard>
              </div>
            </AnimatedContainer>
          )}

          {/* 无障碍功能 */}
          {activeTab === 'accessibility' && (
            <AnimatedContainer animation="slideUp" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">无障碍功能</h2>
                <p className="text-muted-foreground mb-6">
                  全面的无障碍支持，确保所有用户都能顺畅使用
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SmartCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">无障碍设置</h3>
                  <AccessibilitySettings />
                </SmartCard>

                <SmartCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">焦点陷阱演示</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    按Tab键在下方区域内导航，焦点将被限制在此区域内
                  </p>
                  <div className="border border-border rounded-md p-4 space-y-2">
                  <FocusTrap active>
                    <button className="block w-full px-3 py-2 bg-primary text-primary-foreground rounded text-left">
                      按钮 1
                    </button>
                    <button className="block w-full px-3 py-2 bg-secondary text-secondary-foreground rounded text-left">
                      按钮 2
                    </button>
                    <button className="block w-full px-3 py-2 bg-accent text-accent-foreground rounded text-left">
                      按钮 3
                    </button>
                  </FocusTrap>
                  </div>
                </SmartCard>
              </div>

              <SmartCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">屏幕阅读器支持</h3>
                <p className="mb-4">
                  本页面包含完整的屏幕阅读器支持，包括：
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>语义化HTML结构</li>
                  <li>ARIA标签和属性</li>
                  <li>实时区域公告</li>
                  <li>键盘导航支持</li>
                  <li>跳转链接</li>
                </ul>
                <ScreenReaderOnly>
                  这是只有屏幕阅读器才能听到的内容
                </ScreenReaderOnly>
              </SmartCard>
            </AnimatedContainer>
          )}

          {/* 交互效果 */}
          {activeTab === 'interactions' && (
            <AnimatedContainer animation="scaleIn" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">交互效果</h2>
                <p className="text-muted-foreground mb-6">
                  丰富的用户交互反馈和视觉效果
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 波纹效果 */}
                <RippleEffect className="bg-card border rounded-lg p-6 cursor-pointer">
                  <h3 className="text-lg font-semibold mb-2">波纹效果</h3>
                  <p className="text-muted-foreground">点击查看波纹动画</p>
                </RippleEffect>

                {/* 3D倾斜卡片 */}
                <SmartCard hover tilt className="p-6">
                  <h3 className="text-lg font-semibold mb-2">3D倾斜效果</h3>
                  <p className="text-muted-foreground">移动鼠标查看3D效果</p>
                </SmartCard>

                {/* 发光卡片 */}
                <SmartCard hover glow className="p-6">
                  <h3 className="text-lg font-semibold mb-2">发光效果</h3>
                  <p className="text-muted-foreground">悬浮查看发光边框</p>
                </SmartCard>

                {/* 毛玻璃效果 */}
                <SmartCard glass className="p-6">
                  <h3 className="text-lg font-semibold mb-2">毛玻璃效果</h3>
                  <p className="text-muted-foreground">现代化的透明背景</p>
                </SmartCard>

                {/* 数字动画 */}
                <SmartCard className="p-6">
                  <h3 className="text-lg font-semibold mb-2">数字动画</h3>
                  <div className="text-3xl font-bold text-primary mb-2">
                    <CountingNumber value={12345} duration={2} />
                  </div>
                  <p className="text-sm text-muted-foreground">总资产价值</p>
                </SmartCard>

                {/* 悬浮动画 */}
                <motion.div
                  className="bg-card border rounded-lg p-6 cursor-pointer"
                  whileHover={{ 
                    y: -8,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    transition: { duration: 0.3 }
                  }}
                >
                  <h3 className="text-lg font-semibold mb-2">悬浮动画</h3>
                  <p className="text-muted-foreground">悬浮查看抬升效果</p>
                </motion.div>
              </div>
            </AnimatedContainer>
          )}
        </div>

        {/* 页脚 */}
        <ScrollTriggeredAnimation animation="slideUp" className="mt-16 text-center">
          <div className="border-t border-border pt-8">
            <p className="text-muted-foreground">
              AssetWise UI/UX 优化系统 - 现代化、无障碍、高性能
            </p>
          </div>
        </ScrollTriggeredAnimation>
      </div>
    </PageTransition>
  );
}

// 主展示组件
export default function UIShowcase() {
  return (
    <AccessibilityProvider>
      <ThemeManagerProvider>
        <UIShowcaseContent />
      </ThemeManagerProvider>
    </AccessibilityProvider>
  );
}
