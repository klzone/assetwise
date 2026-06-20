/**
 * 虚拟列表组件
 * 用于优化大量数据列表的渲染性能
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number, item: T) => number);
  height: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  estimatedItemHeight?: number; // 用于动态高度
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  estimatedItemHeight = 50,
  getItemKey = (_, index) => index,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);
  
  // 缓存高度计算结果
  const itemHeights = useRef<Map<number, number>>(new Map());
  const measuredCache = useRef<Map<number, number>>(new Map());

  // 计算项目高度
  const getItemHeight = useCallback((index: number): number => {
    if (typeof itemHeight === 'number') {
      return itemHeight;
    }
    
    // 检查缓存
    if (itemHeights.current.has(index)) {
      return itemHeights.current.get(index)!;
    }
    
    // 使用估算高度
    const height = itemHeight(index, items[index]) || estimatedItemHeight;
    itemHeights.current.set(index, height);
    return height;
  }, [itemHeight, items, estimatedItemHeight]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  }, [items.length, getItemHeight]);

  // 计算可见范围
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    if (typeof itemHeight === 'number') {
      // 固定高度的快速计算
      const start = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const end = Math.min(start + visibleCount + overscan, items.length - 1);
      const startWithOverscan = Math.max(start - overscan, 0);
      
      return {
        startIndex: startWithOverscan,
        endIndex: end,
        offsetY: startWithOverscan * itemHeight,
      };
    } else {
      // 动态高度的计算
      let currentTop = 0;
      let startIdx = 0;
      let endIdx = items.length - 1;
      let startFound = false;
      let endFound = false;
      
      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        
        if (!startFound && currentTop + height > scrollTop) {
          startIdx = Math.max(i - overscan, 0);
          startFound = true;
        }
        
        if (!endFound && currentTop > scrollTop + containerHeight) {
          endIdx = Math.min(i + overscan, items.length - 1);
          endFound = true;
          break;
        }
        
        currentTop += height;
      }
      
      // 计算起始偏移
      let offset = 0;
      for (let i = 0; i < startIdx; i++) {
        offset += getItemHeight(i);
      }
      
      return {
        startIndex: startIdx,
        endIndex: endIdx,
        offsetY: offset,
      };
    }
  }, [scrollTop, containerHeight, items.length, itemHeight, overscan, getItemHeight]);

  // 可见项目
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      key: getItemKey(item, startIndex + index),
    }));
  }, [items, startIndex, endIndex, getItemKey]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // 滚动到指定项目
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current) return;

    let targetScrollTop = 0;

    if (typeof itemHeight === 'number') {
      targetScrollTop = index * itemHeight;
      
      if (align === 'center') {
        targetScrollTop -= (containerHeight - itemHeight) / 2;
      } else if (align === 'end') {
        targetScrollTop -= containerHeight - itemHeight;
      }
    } else {
      // 动态高度计算
      for (let i = 0; i < index; i++) {
        targetScrollTop += getItemHeight(i);
      }
      
      if (align === 'center') {
        targetScrollTop -= (containerHeight - getItemHeight(index)) / 2;
      } else if (align === 'end') {
        targetScrollTop -= containerHeight - getItemHeight(index);
      }
    }

    containerRef.current.scrollTop = Math.max(0, targetScrollTop);
  }, [itemHeight, containerHeight, getItemHeight]);

  return {
    VirtualList: (
      <div
        ref={containerRef}
        className={cn(\"overflow-auto\", className)}
        style={{ height }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map(({ item, index, key }) => {
              const style: React.CSSProperties = {
                height: getItemHeight(index),
                position: 'relative',
              };
              
              return (
                <div key={key} style={style}>
                  {renderItem(item, index, style)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    scrollToItem,
    totalHeight,
    visibleRange: { startIndex, endIndex },
  };
}

// 虚拟表格组件
interface VirtualTableProps<T> {
  items: T[];
  columns: {
    key: keyof T | string;
    title: string;
    width?: number;
    render?: (value: any, item: T, index: number) => React.ReactNode;
  }[];
  rowHeight?: number;
  height: number;
  headerHeight?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
}

export function VirtualTable<T extends Record<string, any>>({
  items,
  columns,
  rowHeight = 50,
  height,
  headerHeight = 40,
  className,
  onRowClick,
  getRowKey = (_, index) => index,
}: VirtualTableProps<T>) {
  const { VirtualList, scrollToItem } = VirtualList({
    items,
    itemHeight: rowHeight,
    height: height - headerHeight,
    overscan: 5,
    getItemKey: getRowKey,
    renderItem: (item, index, style) => (
      <div
        className={cn(
          \"flex border-b border-gray-200 hover:bg-gray-50 cursor-pointer\",
          \"dark:border-gray-700 dark:hover:bg-gray-800\"
        )}
        style={style}
        onClick={() => onRowClick?.(item, index)}
      >
        {columns.map((column, colIndex) => {
          const value = item[column.key as keyof T];
          const content = column.render ? column.render(value, item, index) : value;
          
          return (
            <div
              key={colIndex}
              className=\"px-4 py-2 flex items-center truncate\"
              style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
            >
              {content}
            </div>
          );
        })}
      </div>
    ),
  });

  return (
    <div className={cn(\"border border-gray-200 rounded-lg overflow-hidden\", className)}>
      {/* 表头 */}
      <div
        className=\"flex bg-gray-50 border-b border-gray-200 font-medium text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white\"
        style={{ height: headerHeight }}
      >
        {columns.map((column, index) => (
          <div
            key={index}
            className=\"px-4 py-2 flex items-center truncate\"
            style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
          >
            {column.title}
          </div>
        ))}
      </div>
      
      {/* 虚拟列表 */}
      {VirtualList}
    </div>
  );
}

// 虚拟网格组件
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  gap = 8,
  height,
  renderItem,
  className,
  getItemKey = (_, index) => index,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // 计算每行的列数
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowCount = Math.ceil(items.length / columnsPerRow);
  const totalHeight = rowCount * (itemHeight + gap) - gap;

  // 计算可见行范围
  const startRow = Math.floor(scrollTop / (itemHeight + gap));
  const endRow = Math.min(
    startRow + Math.ceil(height / (itemHeight + gap)) + 1,
    rowCount - 1
  );

  // 可见项目
  const visibleItems = useMemo(() => {
    const visible = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columnsPerRow; col++) {
        const index = row * columnsPerRow + col;
        if (index < items.length) {
          visible.push({
            item: items[index],
            index,
            row,
            col,
            key: getItemKey(items[index], index),
          });
        }
      }
    }
    return visible;
  }, [items, startRow, endRow, columnsPerRow, getItemKey]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // 监听容器宽度变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(\"overflow-auto\", className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, row, col, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              left: col * (itemWidth + gap),
              top: row * (itemHeight + gap),
              width: itemWidth,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}"