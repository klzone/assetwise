/**
 * 移动端优化组件
 * 提供触摸友好的交互和手势支持
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceType, useTouchDevice } from '@/lib/responsive/utils';

// 手势类型
type GestureType = 'tap' | 'swipe' | 'pinch' | 'pan';

// 手势事件
interface GestureEvent {
  type: GestureType;
  deltaX?: number;
  deltaY?: number;
  scale?: number;
  center?: { x: number; y: number };
  direction?: 'left' | 'right' | 'up' | 'down';
  velocity?: number;
}

// 手势识别Hook
export function useGestures({
  onTap,
  onSwipe,
  onPinch,
  onPan,
  threshold = 10,
  swipeThreshold = 50,
}: {
  onTap?: (event: GestureEvent) => void;
  onSwipe?: (event: GestureEvent) => void;
  onPinch?: (event: GestureEvent) => void;
  onPan?: (event: GestureEvent) => void;
  threshold?: number;
  swipeThreshold?: number;
}) {
  const [isTouch, setIsTouch] = useState(false);
  const [touches, setTouches] = useState<React.Touch[]>([]);
  const startTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialDistanceRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsTouch(true);
    const touch = e.touches[0];
    const touchData = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    
    startTouchRef.current = touchData;
    lastTouchRef.current = touchData;
    setTouches(Array.from(e.touches));

    // 初始化双指距离（用于缩放检测）
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      initialDistanceRef.current = distance;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startTouchRef.current) return;

    const touch = e.touches[0];
    const currentTouch = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = currentTouch.x - startTouchRef.current.x;
    const deltaY = currentTouch.y - startTouchRef.current.y;

    // 双指缩放检测
    if (e.touches.length === 2 && initialDistanceRef.current && onPinch) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = currentDistance / initialDistanceRef.current;
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      onPinch({
        type: 'pinch',
        scale,
        center,
      });
    }

    // 拖拽检测
    if (onPan && (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold)) {
      const velocity = lastTouchRef.current ? 
        Math.sqrt(
          Math.pow(currentTouch.x - lastTouchRef.current.x, 2) +
          Math.pow(currentTouch.y - lastTouchRef.current.y, 2)
        ) / (currentTouch.time - lastTouchRef.current.time) : 0;

      onPan({
        type: 'pan',
        deltaX,
        deltaY,
        velocity,
      });
    }

    lastTouchRef.current = currentTouch;
    setTouches(Array.from(e.touches));
  }, [threshold, onPinch, onPan]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startTouchRef.current) return;

    const endTime = Date.now();
    const duration = endTime - startTouchRef.current.time;
    
    // 如果还有触摸点，不处理手势
    if (e.touches.length > 0) {
      setTouches(Array.from(e.touches));
      return;
    }

    const finalTouch = e.changedTouches[0];
    const deltaX = finalTouch.clientX - startTouchRef.current.x;
    const deltaY = finalTouch.clientY - startTouchRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration;

    // 点击检测
    if (distance < threshold && duration < 300 && onTap) {
      onTap({
        type: 'tap',
        center: {
          x: finalTouch.clientX,
          y: finalTouch.clientY,
        },
      });
    }
    // 滑动检测
    else if (distance > swipeThreshold && velocity > 0.1 && onSwipe) {
      let direction: 'left' | 'right' | 'up' | 'down';
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      onSwipe({
        type: 'swipe',
        deltaX,
        deltaY,
        direction,
        velocity,
      });
    }

    // 清理状态
    setIsTouch(false);
    setTouches([]);
    startTouchRef.current = null;
    lastTouchRef.current = null;
    initialDistanceRef.current = null;
  }, [threshold, swipeThreshold, onTap, onSwipe]);

  return {
    touchProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isTouch,
    touchCount: touches.length,
  };
}

// 触摸友好的按钮组件
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  ripple?: boolean;
  haptic?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ripple = true,
  haptic = true,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTouchDevice = useTouchDevice();

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };

  const variantClasses = {
    default: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  };

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // 触觉反馈
    if (haptic && isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // 波纹效果
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples(prev => [...prev, { id, x, y }]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    onClick?.(e);
  }, [onClick, ripple, haptic, isTouchDevice]);

  return (
    <button
      ref={buttonRef}
      className={cn(
        'relative overflow-hidden rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation', // 优化触摸性能
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
      
      {/* 波纹效果 */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </button>
  );
};

// 滑动操作组件
interface SwipeActionProps {
  children: React.ReactNode;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
    onAction: () => void;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
    onAction: () => void;
  };
  threshold?: number;
}

export const SwipeAction: React.FC<SwipeActionProps> = ({
  children,
  leftAction,
  rightAction,
  threshold = 80,
}) => {
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeThreshold = threshold ?? 80;

  const { touchProps } = useGestures({
    onPan: ({ deltaX }) => {
      if (isAnimating) return;
      
      let newOffset = deltaX ?? 0;
      
      // 限制滑动范围
      if (leftAction) {
        newOffset = Math.max(newOffset, -swipeThreshold * 1.5);
      } else {
        newOffset = Math.max(newOffset, 0);
      }
      
      if (rightAction) {
        newOffset = Math.min(newOffset, swipeThreshold * 1.5);
      } else {
        newOffset = Math.min(newOffset, 0);
      }
      
      setOffset(newOffset);
    },
    onSwipe: ({ direction, velocity }) => {
      if (isAnimating) return;
      const swipeVelocity = velocity ?? 0;
      
      if (direction === 'left' && rightAction && swipeVelocity > 0.3) {
        // 向左滑动，显示右侧操作
        setIsAnimating(true);
        setOffset(swipeThreshold);
        setTimeout(() => {
          rightAction.onAction();
          setOffset(0);
          setIsAnimating(false);
        }, 200);
      } else if (direction === 'right' && leftAction && swipeVelocity > 0.3) {
        // 向右滑动，显示左侧操作
        setIsAnimating(true);
        setOffset(-swipeThreshold);
        setTimeout(() => {
          leftAction.onAction();
          setOffset(0);
          setIsAnimating(false);
        }, 200);
      } else {
        // 回弹
        setOffset(0);
      }
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffset(0);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-white"
      {...touchProps}
    >
      {/* 左侧操作 */}
      {leftAction && (
        <div
          className={cn(
            'absolute left-0 top-0 h-full flex items-center justify-center',
            'text-white font-medium transition-all duration-200',
            leftAction.color
          )}
          style={{
            width: Math.abs(Math.min(offset, 0)),
            opacity: Math.abs(Math.min(offset, 0)) / swipeThreshold,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {leftAction.icon}
            <span className="text-xs">{leftAction.label}</span>
          </div>
        </div>
      )}
      
      {/* 右侧操作 */}
      {rightAction && (
        <div
          className={cn(
            'absolute right-0 top-0 h-full flex items-center justify-center',
            'text-white font-medium transition-all duration-200',
            rightAction.color
          )}
          style={{
            width: Math.max(offset, 0),
            opacity: Math.max(offset, 0) / swipeThreshold,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {rightAction.icon}
            <span className="text-xs">{rightAction.label}</span>
          </div>
        </div>
      )}
      
      {/* 主内容 */}
      <div
        className={cn(
          'transition-transform duration-200 bg-white',
          isAnimating && 'transition-transform duration-200'
        )}
        style={{
          transform: `translateX(${offset}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// 底部抽屉组件
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
  snapPoints?: number[];
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  height = '50vh',
  snapPoints = [0.3, 0.6, 0.9],
}) => {
  const [currentSnap, setCurrentSnap] = useState(snapPoints[0]);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const { touchProps } = useGestures({
    onPan: ({ deltaY }) => {
      if (!isOpen) return;
      const panDeltaY = deltaY ?? 0;
      
      const newSnap = Math.max(0, Math.min(1, currentSnap - panDeltaY / window.innerHeight));
      setCurrentSnap(newSnap);
      setIsDragging(true);
    },
    onSwipe: ({ direction, velocity }) => {
      if (!isOpen) return;
      const swipeVelocity = velocity ?? 0;
      
      if (direction === 'down' && swipeVelocity > 0.5) {
        onClose();
      } else {
        // 找到最近的吸附点
        const closest = snapPoints.reduce((prev, curr) => 
          Math.abs(curr - currentSnap) < Math.abs(prev - currentSnap) ? curr : prev
        );
        setCurrentSnap(closest);
      }
      setIsDragging(false);
    },
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentSnap(snapPoints[0]);
    }
  }, [isOpen, snapPoints]);

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* 抽屉 */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50',
          'transition-transform duration-300 ease-out',
          isDragging && 'transition-none'
        )}
        style={{
          transform: `translateY(${(1 - currentSnap) * 100}%)`,
          height,
        }}
        {...touchProps}
      >
        {/* 拖拽指示器 */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* 内容 */}
        <div className="px-4 pb-4 overflow-auto" style={{ height: 'calc(100% - 24px)' }}>
          {children}
        </div>
      </div>
    </>
  );
};

// 下拉刷新组件
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 60,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { touchProps } = useGestures({
    onPan: ({ deltaY }) => {
      if (isRefreshing) return;
      const panDeltaY = deltaY ?? 0;
      
      // 只在顶部时允许下拉
      if (containerRef.current && containerRef.current.scrollTop === 0 && panDeltaY > 0) {
        setPullDistance(Math.min(panDeltaY, threshold * 1.5));
        setCanRefresh(panDeltaY >= threshold);
      }
    },
  });

  const handleTouchEnd = useCallback(async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [canRefresh, isRefreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      {...touchProps}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉指示器 */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'text-gray-500 transition-all duration-200 z-10'
        )}
        style={{
          height: pullDistance,
          transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`,
        }}
      >
        {isRefreshing ? (
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        ) : (
          <div className={cn(
            'transition-transform duration-200',
            canRefresh && 'rotate-180'
          )}>
            ↓
          </div>
        )}
      </div>
      
      {/* 内容区域 */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};
