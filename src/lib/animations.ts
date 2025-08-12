// 动画配置和工具函数
export const animations = {
  // 基础动画时长
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // 缓动函数
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // 页面切换动画
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  
  // 卡片动画
  cardHover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  
  // 按钮动画
  buttonPress: {
    scale: 0.95,
    transition: { duration: 0.1 }
  },
  
  // 加载动画
  loading: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: 'linear' }
  },
  
  // 淡入动画
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 }
  },
  
  // 滑入动画
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3 }
  },
  
  // 弹跳动画
  bounce: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
  
  // 数字计数动画
  countUp: {
    transition: { duration: 1.5, ease: 'easeOut' }
  },
  
  // 进度条动画
  progressBar: {
    initial: { width: 0 },
    animate: { width: '100%' },
    transition: { duration: 1, ease: 'easeOut' }
  },
  
  // 脉冲动画
  pulse: {
    scale: [1, 1.05, 1],
    transition: { 
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// 动画延迟工具
export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// 视差滚动动画
export const parallaxScroll = (offset: number = 0.5) => ({
  y: offset * 100,
  transition: { type: 'spring', stiffness: 100 }
})

// 响应式动画（根据设备性能调整）
export const getResponsiveAnimation = (animation: any) => {
  // 检测是否为低性能设备
  const isLowPerformance = typeof window !== 'undefined' && 
    (window.navigator.hardwareConcurrency <= 2 || 
     window.navigator.connection?.effectiveType === 'slow-2g')
  
  if (isLowPerformance) {
    // 简化动画或禁用
    return {
      ...animation,
      transition: { ...animation.transition, duration: 0.1 }
    }
  }
  
  return animation
}

// 手势动画配置
export const gestureAnimations = {
  drag: {
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragElastic: 0.1,
    whileDrag: { scale: 1.05 }
  },
  
  tap: {
    whileTap: { scale: 0.95 }
  },
  
  hover: {
    whileHover: { scale: 1.02, y: -2 }
  }
}

// 路径动画（用于SVG图标）
export const pathAnimation = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: 1.5, ease: 'easeInOut' }
}

// 文字打字机效果
export const typewriterEffect = (text: string, speed: number = 50) => {
  return {
    initial: { width: 0 },
    animate: { width: 'auto' },
    transition: { 
      duration: (text.length * speed) / 1000,
      ease: 'linear'
    }
  }
}