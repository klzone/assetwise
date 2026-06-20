/**
 * 高性能图表组件库
 * 支持大数据量渲染、实时更新和丰富的交互功能
 */

'use client';

import React, { 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect, 
  useState,
  memo,
} from 'react';
import {
  LineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart as RechartsComposedChart,
  ReferenceLine,
  Brush,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// 颜色主题
export const CHART_COLORS = {
  primary: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
  gradient: [
    'url(#primaryGradient)',
    'url(#secondaryGradient)',
    'url(#successGradient)',
    'url(#warningGradient)',
    'url(#dangerGradient)',
  ],
  semantic: {
    up: '#10B981',
    down: '#EF4444',
    neutral: '#6B7280',
  },
};

// 图表主题配置
export const CHART_THEME = {
  colors: CHART_COLORS.primary,
  fontSize: 12,
  fontFamily: 'Inter, system-ui, sans-serif',
  grid: {
    stroke: 'hsl(var(--border))',
    strokeDasharray: '3 3',
    strokeOpacity: 0.3,
  },
  axis: {
    stroke: 'hsl(var(--muted-foreground))',
    fontSize: 11,
  },
  tooltip: {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
};

// 数据虚拟化 Hook
function useDataVirtualization(data: any[], windowSize: number = 1000) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: windowSize });
  
  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);
  
  const updateRange = useCallback((start: number, end: number) => {
    setVisibleRange({ start: Math.max(0, start), end: Math.min(data.length, end) });
  }, [data.length]);
  
  return { visibleData, updateRange, totalCount: data.length };
}

// 自定义工具提示组件
const CustomTooltip = memo(({ 
  active, 
  payload, 
  label, 
  formatter,
  labelFormatter,
  currency = '$',
}: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-popover border border-border rounded-lg p-3 shadow-lg"
    >
      <div className="text-sm font-medium text-foreground mb-2">
        {labelFormatter ? labelFormatter(label) : label}
      </div>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {formatter ? formatter(entry.value, entry.name) : `${currency}${entry.value.toLocaleString()}`}
          </span>
        </div>
      ))}
    </motion.div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

// 渐变定义组件
const GradientDefinitions = memo(() => (
  <defs>
    <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
    </linearGradient>
  </defs>
));

GradientDefinitions.displayName = 'GradientDefinitions';

// 时间序列图表
export const TimeSeriesChart = memo(({
  data,
  height = 400,
  showBrush = false,
  showGrid = true,
  animate = true,
  lines = [{ key: 'value', name: '数值', color: CHART_COLORS.primary[0] }],
  timeFormat = 'MMM dd',
  valueFormatter = (value: number) => `$${value.toLocaleString()}`,
  onPointClick,
}: {
  data: any[];
  height?: number;
  showBrush?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  lines?: Array<{
    key: string;
    name: string;
    color?: string;
    type?: 'monotone' | 'linear' | 'step';
  }>;
  timeFormat?: string;
  valueFormatter?: (value: number) => string;
  onPointClick?: (data: any) => void;
}) => {
  const { visibleData } = useDataVirtualization(data, 500);
  
  const formatTime = useCallback((time: string | Date) => {
    const date = typeof time === 'string' ? parseISO(time) : time;
    return format(date, timeFormat);
  }, [timeFormat]);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={visibleData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <GradientDefinitions />
          
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={CHART_THEME.grid.stroke}
              strokeOpacity={CHART_THEME.grid.strokeOpacity}
            />
          )}
          
          <XAxis 
            dataKey="time"
            tickFormatter={formatTime}
            stroke={CHART_THEME.axis.stroke}
            fontSize={CHART_THEME.axis.fontSize}
          />
          
          <YAxis 
            tickFormatter={valueFormatter}
            stroke={CHART_THEME.axis.stroke}
            fontSize={CHART_THEME.axis.fontSize}
          />
          
          <Tooltip 
            content={<CustomTooltip formatter={valueFormatter} labelFormatter={formatTime} />}
          />
          
          <Legend />
          
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type={line.type || 'monotone'}
              dataKey={line.key}
              name={line.name}
              stroke={line.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: line.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length],
                onClick: onPointClick,
              }}
              animationDuration={animate ? 1000 : 0}
            />
          ))}
          
          {showBrush && (
            <Brush 
              dataKey="time" 
              height={30} 
              stroke={CHART_COLORS.primary[0]}
              tickFormatter={formatTime}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

TimeSeriesChart.displayName = 'TimeSeriesChart';

// 面积图表
export const AreaChart = memo(({
  data,
  height = 400,
  stacked = false,
  areas = [{ key: 'value', name: '数值', color: CHART_COLORS.primary[0] }],
  ...props
}: {
  data: any[];
  height?: number;
  stacked?: boolean;
  areas?: Array<{
    key: string;
    name: string;
    color?: string;
    fill?: string;
  }>;
  [key: string]: any;
}) => {
  const { visibleData } = useDataVirtualization(data, 500);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={visibleData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <GradientDefinitions />
          
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
          <XAxis dataKey="time" stroke={CHART_THEME.axis.stroke} />
          <YAxis stroke={CHART_THEME.axis.stroke} />
          <Tooltip content={<CustomTooltip />} />
          
          {areas.map((area, index) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.name}
              stackId={stacked ? "1" : undefined}
              stroke={area.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
              fill={area.fill || CHART_COLORS.gradient[index % CHART_COLORS.gradient.length]}
              fillOpacity={0.6}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
});

AreaChart.displayName = 'AreaChart';

// 柱状图
export const BarChart = memo(({
  data,
  height = 400,
  bars = [{ key: 'value', name: '数值', color: CHART_COLORS.primary[0] }],
  layout = 'vertical',
  ...props
}: {
  data: any[];
  height?: number;
  bars?: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  layout?: 'vertical' | 'horizontal';
  [key: string]: any;
}) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={data} 
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
          <XAxis 
            type={layout === 'vertical' ? 'number' : 'category'}
            dataKey={layout === 'vertical' ? undefined : 'name'}
            stroke={CHART_THEME.axis.stroke}
          />
          <YAxis 
            type={layout === 'vertical' ? 'category' : 'number'}
            dataKey={layout === 'vertical' ? 'name' : undefined}
            stroke={CHART_THEME.axis.stroke}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
});

BarChart.displayName = 'BarChart';

// 饼图
export const PieChart = memo(({
  data,
  height = 400,
  innerRadius = 0,
  outerRadius = 120,
  showLabels = true,
  labelFormatter = (value: any) => value.name,
  valueFormatter = (value: number) => `$${value.toLocaleString()}`,
}: {
  data: any[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  labelFormatter?: (value: any) => string;
  valueFormatter?: (value: number) => string;
}) => {
  const dataWithColors = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      color: item.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length],
    }));
  }, [data]);

  const renderCustomLabel = useCallback((entry: any) => {
    if (!showLabels) return null;
    
    const percent = ((entry.value / entry.payload.total) * 100).toFixed(1);
    return `${entry.name} (${percent}%)`;
  }, [showLabels]);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? renderCustomLabel : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1000}
          >
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip formatter={valueFormatter} />}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
});

PieChart.displayName = 'PieChart';

// 组合图表
export const ComposedChart = memo(({
  data,
  height = 400,
  elements = [],
}: {
  data: any[];
  height?: number;
  elements?: Array<{
    type: 'line' | 'bar' | 'area';
    key: string;
    name: string;
    color?: string;
    yAxisId?: string;
  }>;
}) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsComposedChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <GradientDefinitions />
          
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
          <XAxis dataKey="name" stroke={CHART_THEME.axis.stroke} />
          <YAxis yAxisId="left" stroke={CHART_THEME.axis.stroke} />
          <YAxis yAxisId="right" orientation="right" stroke={CHART_THEME.axis.stroke} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {elements.map((element, index) => {
            const color = element.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length];
            
            switch (element.type) {
              case 'bar':
                return (
                  <Bar
                    key={element.key}
                    yAxisId={element.yAxisId || 'left'}
                    dataKey={element.key}
                    name={element.name}
                    fill={color}
                  />
                );
              case 'area':
                return (
                  <Area
                    key={element.key}
                    yAxisId={element.yAxisId || 'left'}
                    type="monotone"
                    dataKey={element.key}
                    name={element.name}
                    fill={color}
                    stroke={color}
                  />
                );
              case 'line':
              default:
                return (
                  <Line
                    key={element.key}
                    yAxisId={element.yAxisId || 'right'}
                    type="monotone"
                    dataKey={element.key}
                    name={element.name}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />
                );
            }
          })}
        </RechartsComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

ComposedChart.displayName = 'ComposedChart';

// 实时图表容器
export const RealTimeChart = memo(({
  children,
  updateInterval = 5000,
  maxDataPoints = 100,
  onDataUpdate,
}: {
  children: React.ReactNode;
  updateInterval?: number;
  maxDataPoints?: number;
  onDataUpdate?: () => Promise<any[]>;
}) => {
  const [isRealTime, setIsRealTime] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isRealTime && onDataUpdate) {
      intervalRef.current = setInterval(async () => {
        try {
          await onDataUpdate();
        } catch (error) {
          console.error('Real-time update failed:', error);
        }
      }, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealTime, updateInterval, onDataUpdate]);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => setIsRealTime(!isRealTime)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            isRealTime
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
          }`}
        >
          {isRealTime ? '实时' : '暂停'}
        </button>
      </div>
      {children}
    </div>
  );
});

RealTimeChart.displayName = 'RealTimeChart';

// 图表导出功能
export const useChartExport = () => {
  const exportToSVG = useCallback((chartElement: Element, filename: string) => {
    const svg = chartElement.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, []);

  const exportToPNG = useCallback(async (chartElement: Element, filename: string) => {
    const svg = chartElement.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    return new Promise<void>((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
          resolve();
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    });
  }, []);

  return { exportToSVG, exportToPNG };
};
