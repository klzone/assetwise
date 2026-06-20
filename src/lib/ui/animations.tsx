/**
 * 动画和微交互系统
 * 提供丰富的动画效果、过渡动画、微交互和用户反馈
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useAnimation, useInView } from 'framer-motion';

// 动画配置
export const ANIMATION_CONFIGS = {
  // 基础动画
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  // 弹跳动画
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
    exit: { opacity: 0, scale: 0.3 },
  },
  // 抖动动画
  shake: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
  },
  // 脉冲动画
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
};

// 动画容器组件
export function AnimatedContainer({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  animation?: keyof typeof ANIMATION_CONFIGS;
  delay?: number;
  className?: string;
  [key: string]: any;
}) {
  const config = ANIMATION_CONFIGS[animation];
  
  return (
    <motion.div
      className={className}
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={{ ...config.transition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// 页面过渡动画
export function PageTransition({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

// 滚动触发动画
export function ScrollTriggeredAnimation({
  children,
  animation = 'slideUp',
  threshold = 0.1,
  className = '',
}: {
  children: React.ReactNode;
  animation?: keyof typeof ANIMATION_CONFIGS;
  threshold?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold });
  const config = ANIMATION_CONFIGS[animation];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={config.initial}
      animate={isInView ? config.animate : config.initial}
      transition={config.transition}
    >
      {children}
    </motion.div>
  );
}

// 鼠标跟踪动画
export function MouseTrackingCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* 鼠标光效 */}
      <AnimatePresence>
        {isHovering && (
          <motion.div
            className="absolute pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
              left: mousePosition.x - 50,
              top: mousePosition.y - 50,
              width: 100,
              height: 100,
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        )}
      </AnimatePresence>
      {children}
    </motion.div>
  );
}

// 数字计数动画
export function CountingNumber({
  value,
  duration = 2,
  className = '',
  format = (num: number) => num.toLocaleString(),
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (num: number) => string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.3, once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration, isInView]);

  return (
    <span ref={ref} className={className}>
      {format(count)}
    </span>
  );
}

// 磁性按钮（鼠标吸附效果）
export function MagneticButton({
  children,
  strength = 0.3,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  [key: string]: any;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={buttonRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// 波纹效果
export function RippleEffect({
  children,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.6)',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
  [key: string]: any;
}) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const addRipple = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    setRipples(prev => [...prev, ripple]);
    
    // 移除波纹
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseDown={addRipple}
      {...props}
    >
      {children}
      
      {/* 波纹动画 */}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            backgroundColor: rippleColor,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// 悬浮提示动画
export function HoverTooltip({
  children,
  content,
  position = 'top',
  className = '',
}: {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded whitespace-nowrap ${positionClasses[position]}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {content}
            
            {/* 箭头 */}
            <div
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
                position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
                position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
                'right-full top-1/2 -translate-y-1/2 -mr-1'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 加载骨架屏动画
export function SkeletonLoader({
  width = '100%',
  height = '1rem',
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <div
      className={`bg-muted rounded animate-pulse ${className}`}
      style={{ width, height }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// 进度条动画
export function AnimatedProgressBar({
  progress,
  height = 8,
  className = '',
  showPercentage = false,
}: {
  progress: number;
  height?: number;
  className?: string;
  showPercentage?: boolean;
}) {
  return (
    <div className={className}>
      <div 
        className="bg-muted rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className="bg-primary h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      
      {showPercentage && (
        <motion.div
          className="text-sm text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <CountingNumber value={progress} duration={0.5} format={(num) => `${Math.round(num)}%`} />
        </motion.div>
      )}
    </div>
  );
}

// 粒子效果背景
export function ParticleBackground({
  particleCount = 50,
  className = '',
}: {
  particleCount?: number;
  className?: string;
}) {
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    duration: Math.random() * 20 + 10,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute bg-primary/20 rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.initialX}%`,
            top: `${particle.initialY}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// 动画钩子
export function useAnimatedValue(
  targetValue: number,
  duration: number = 1000
) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCurrentValue(targetValue * progress);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [targetValue, duration]);

  return currentValue;
}