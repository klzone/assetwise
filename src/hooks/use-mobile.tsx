'use client';

import { useEffect, useState } from 'react';

/**
 * 检测设备是否为移动设备的自定义Hook
 * @param breakpoint 断点像素值，默认768px
 * @returns boolean 是否为移动设备
 */
export function useMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // 检查是否在客户端环境
    if (typeof window === 'undefined') return;

    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // 初始检查
    checkIsMobile();

    // 添加窗口大小变化监听器
    window.addEventListener('resize', checkIsMobile);

    // 清理函数
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

export const useIsMobile = useMobile;