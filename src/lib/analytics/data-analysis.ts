/**
 * 数据分析引擎
 * 提供高性能数据处理、统计分析、趋势预测和智能洞察
 */

import { format, parseISO, differenceInDays, startOfDay, endOfDay } from 'date-fns';

// 数据类型定义
export interface DataPoint {
  time: string | Date;
  value: number;
  [key: string]: any;
}

export interface TimeSeries {
  data: DataPoint[];
  name: string;
  unit?: string;
}

export interface AnalysisResult {
  trend: 'up' | 'down' | 'flat';
  change: number;
  changePercent: number;
  confidence: number;
  insights: string[];
}

export interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  mode: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  range: number;
  skewness: number;
  kurtosis: number;
}

// 数据处理工具类
export class DataProcessor {
  /**
   * 数据清洗和预处理
   */
  static cleanData(data: DataPoint[]): DataPoint[] {
    return data
      .filter(point => point.value !== null && point.value !== undefined && !isNaN(point.value))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .map(point => ({
        ...point,
        time: typeof point.time === 'string' ? parseISO(point.time) : point.time,
        value: Number(point.value),
      }));
  }

  /**
   * 数据重采样 - 将数据按指定时间间隔聚合
   */
  static resample(
    data: DataPoint[], 
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month',
    aggregation: 'mean' | 'sum' | 'max' | 'min' | 'last' = 'mean'
  ): DataPoint[] {
    if (data.length === 0) return [];

    const cleanData = this.cleanData(data);
    const grouped = new Map<string, DataPoint[]>();

    cleanData.forEach(point => {
      const date = new Date(point.time);
      let key: string;

      switch (interval) {
        case 'minute':
          key = format(date, 'yyyy-MM-dd HH:mm');
          break;
        case 'hour':
          key = format(date, 'yyyy-MM-dd HH');
          break;
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          key = format(date, 'yyyy-ww');
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(point);
    });

    return Array.from(grouped.entries()).map(([key, points]) => {
      const values = points.map(p => p.value);
      let aggregatedValue: number;

      switch (aggregation) {
        case 'sum':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'last':
          aggregatedValue = values[values.length - 1];
          break;
        case 'mean':
        default:
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      }

      return {
        time: points[0].time,
        value: aggregatedValue,
        count: points.length,
        ...points[0], // 保留其他属性
      };
    });
  }

  /**
   * 移动平均计算
   */
  static movingAverage(data: DataPoint[], window: number, type: 'simple' | 'exponential' = 'simple'): DataPoint[] {
    if (data.length < window) return data;

    const result: DataPoint[] = [];

    for (let i = 0; i < data.length; i++) {
      if (type === 'simple') {
        if (i >= window - 1) {
          const sum = data.slice(i - window + 1, i + 1).reduce((acc, point) => acc + point.value, 0);
          result.push({
            ...data[i],
            value: sum / window,
            originalValue: data[i].value,
          });
        }
      } else if (type === 'exponential') {
        const multiplier = 2 / (window + 1);
        if (i === 0) {
          result.push({ ...data[i] });
        } else {
          const ema = (data[i].value - result[i - 1].value) * multiplier + result[i - 1].value;
          result.push({
            ...data[i],
            value: ema,
            originalValue: data[i].value,
          });
        }
      }
    }

    return result;
  }

  /**
   * 数据标准化
   */
  static normalize(data: DataPoint[], method: 'minmax' | 'zscore' = 'minmax'): DataPoint[] {
    const values = data.map(d => d.value);
    
    if (method === 'minmax') {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      
      if (range === 0) return data;
      
      return data.map(point => ({
        ...point,
        value: (point.value - min) / range,
        originalValue: point.value,
      }));
    } else {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
      
      if (std === 0) return data;
      
      return data.map(point => ({
        ...point,
        value: (point.value - mean) / std,
        originalValue: point.value,
      }));
    }
  }

  /**
   * 异常值检测 (IQR方法)
   */
  static detectOutliers(data: DataPoint[], threshold: number = 1.5): {
    outliers: DataPoint[];
    cleaned: DataPoint[];
    bounds: { lower: number; upper: number };
  } {
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    
    const q1 = values[q1Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - threshold * iqr;
    const upperBound = q3 + threshold * iqr;
    
    const outliers = data.filter(point => point.value < lowerBound || point.value > upperBound);
    const cleaned = data.filter(point => point.value >= lowerBound && point.value <= upperBound);
    
    return {
      outliers,
      cleaned,
      bounds: { lower: lowerBound, upper: upperBound },
    };
  }
}

// 统计分析工具类
export class StatisticalAnalyzer {
  /**
   * 计算描述性统计
   */
  static descriptiveStats(data: DataPoint[]): StatisticalSummary {
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const n = values.length;
    
    if (n === 0) {
      throw new Error('数据集为空');
    }
    
    // 基本统计量
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    const min = values[0];
    const max = values[n - 1];
    const range = max - min;
    
    // 中位数
    const median = n % 2 === 0 
      ? (values[n / 2 - 1] + values[n / 2]) / 2
      : values[Math.floor(n / 2)];
    
    // 四分位数
    const q1 = values[Math.floor(n * 0.25)];
    const q3 = values[Math.floor(n * 0.75)];
    
    // 众数
    const frequency = new Map<number, number>();
    values.forEach(val => {
      frequency.set(val, (frequency.get(val) || 0) + 1);
    });
    const mode = Array.from(frequency.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    // 方差和标准差
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    
    // 偏度和峰度
    const skewness = values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0) / n;
    const kurtosis = values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 4), 0) / n - 3;
    
    return {
      count: n,
      mean,
      median,
      mode,
      std,
      variance,
      min,
      max,
      q1,
      q3,
      range,
      skewness,
      kurtosis,
    };
  }

  /**
   * 计算相关系数
   */
  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('数据长度不匹配');
    }
    
    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      
      numerator += deltaX * deltaY;
      sumXSquared += deltaX * deltaX;
      sumYSquared += deltaY * deltaY;
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 线性回归分析
   */
  static linearRegression(data: DataPoint[]): {
    slope: number;
    intercept: number;
    rSquared: number;
    equation: string;
    predict: (x: number) => number;
  } {
    const n = data.length;
    const x = data.map((_, index) => index);
    const y = data.map(d => d.value);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXSquared = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXSquared - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // 计算 R²
    const meanY = sumY / n;
    const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const residualSumSquares = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    
    return {
      slope,
      intercept,
      rSquared,
      equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
      predict: (x: number) => slope * x + intercept,
    };
  }
}

// 趋势分析器
export class TrendAnalyzer {
  /**
   * 趋势检测
   */
  static detectTrend(data: DataPoint[], windowSize: number = 10): AnalysisResult {
    if (data.length < windowSize) {
      return {
        trend: 'flat',
        change: 0,
        changePercent: 0,
        confidence: 0,
        insights: ['数据点不足，无法进行趋势分析'],
      };
    }
    
    const recentData = data.slice(-windowSize);
    const regression = StatisticalAnalyzer.linearRegression(recentData);
    
    const firstValue = recentData[0].value;
    const lastValue = recentData[recentData.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
    
    // 判断趋势方向
    let trend: 'up' | 'down' | 'flat';
    const slopeThreshold = Math.abs(firstValue) * 0.01; // 1% 阈值
    
    if (Math.abs(regression.slope) < slopeThreshold) {
      trend = 'flat';
    } else if (regression.slope > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }
    
    // 计算置信度（基于 R² 值）
    const confidence = Math.min(regression.rSquared, 1) * 100;
    
    // 生成洞察
    const insights = this.generateInsights(data, trend, change, changePercent, confidence, regression);
    
    return {
      trend,
      change,
      changePercent,
      confidence,
      insights,
    };
  }

  /**
   * 生成分析洞察
   */
  private static generateInsights(
    data: DataPoint[],
    trend: 'up' | 'down' | 'flat',
    change: number,
    changePercent: number,
    confidence: number,
    regression: any
  ): string[] {
    const insights: string[] = [];
    
    // 趋势洞察
    if (trend === 'up') {
      insights.push(`数据呈现上升趋势，增长了 ${Math.abs(changePercent).toFixed(2)}%`);
    } else if (trend === 'down') {
      insights.push(`数据呈现下降趋势，下降了 ${Math.abs(changePercent).toFixed(2)}%`);
    } else {
      insights.push('数据相对平稳，没有明显的趋势变化');
    }
    
    // 置信度洞察
    if (confidence > 80) {
      insights.push(`趋势预测的可靠性很高（${confidence.toFixed(1)}%）`);
    } else if (confidence > 60) {
      insights.push(`趋势预测具有中等可靠性（${confidence.toFixed(1)}%）`);
    } else {
      insights.push(`趋势预测的可靠性较低（${confidence.toFixed(1)}%），建议谨慎解读`);
    }
    
    // 波动性洞察
    const stats = StatisticalAnalyzer.descriptiveStats(data);
    const coefficientOfVariation = (stats.std / Math.abs(stats.mean)) * 100;
    
    if (coefficientOfVariation > 30) {
      insights.push('数据波动性较大，存在较高的不确定性');
    } else if (coefficientOfVariation > 15) {
      insights.push('数据波动性适中');
    } else {
      insights.push('数据相对稳定，波动性较小');
    }
    
    // 异常值洞察
    const outlierAnalysis = DataProcessor.detectOutliers(data);
    if (outlierAnalysis.outliers.length > 0) {
      const outlierPercentage = (outlierAnalysis.outliers.length / data.length) * 100;
      insights.push(`发现 ${outlierAnalysis.outliers.length} 个异常值（占 ${outlierPercentage.toFixed(1)}%）`);
    }
    
    return insights;
  }

  /**
   * 季节性分析
   */
  static seasonalityAnalysis(data: DataPoint[], period: number = 7): {
    hasSeasonality: boolean;
    strength: number;
    pattern: number[];
    insights: string[];
  } {
    if (data.length < period * 2) {
      return {
        hasSeasonality: false,
        strength: 0,
        pattern: [],
        insights: ['数据不足，无法进行季节性分析'],
      };
    }
    
    // 按周期分组计算平均值
    const periodAverages = new Array(period).fill(0);
    const periodCounts = new Array(period).fill(0);
    
    data.forEach((point, index) => {
      const periodIndex = index % period;
      periodAverages[periodIndex] += point.value;
      periodCounts[periodIndex]++;
    });
    
    const pattern = periodAverages.map((sum, index) => 
      periodCounts[index] > 0 ? sum / periodCounts[index] : 0
    );
    
    // 计算季节性强度
    const overallMean = data.reduce((sum, point) => sum + point.value, 0) / data.length;
    const seasonalVariance = pattern.reduce((sum, avg) => sum + Math.pow(avg - overallMean, 2), 0) / period;
    const totalVariance = data.reduce((sum, point) => sum + Math.pow(point.value - overallMean, 2), 0) / data.length;
    
    const strength = totalVariance > 0 ? seasonalVariance / totalVariance : 0;
    const hasSeasonality = strength > 0.1; // 10% 阈值
    
    const insights: string[] = [];
    if (hasSeasonality) {
      insights.push(`检测到明显的季节性模式，强度为 ${(strength * 100).toFixed(1)}%`);
      
      // 找出最高和最低的周期点
      const maxIndex = pattern.indexOf(Math.max(...pattern));
      const minIndex = pattern.indexOf(Math.min(...pattern));
      insights.push(`周期内第 ${maxIndex + 1} 个时间点通常最高，第 ${minIndex + 1} 个时间点通常最低`);
    } else {
      insights.push('未检测到明显的季节性模式');
    }
    
    return {
      hasSeasonality,
      strength,
      pattern,
      insights,
    };
  }
}

// 预测分析器
export class ForecastAnalyzer {
  /**
   * 简单线性预测
   */
  static linearForecast(data: DataPoint[], periods: number): DataPoint[] {
    const regression = StatisticalAnalyzer.linearRegression(data);
    const forecast: DataPoint[] = [];
    
    const lastPoint = data[data.length - 1];
    const lastTime = new Date(lastPoint.time);
    
    for (let i = 1; i <= periods; i++) {
      const futureTime = new Date(lastTime.getTime() + i * 24 * 60 * 60 * 1000); // 假设日间隔
      const predictedValue = regression.predict(data.length + i - 1);
      
      forecast.push({
        time: futureTime,
        value: predictedValue,
        predicted: true,
        confidence: regression.rSquared,
      });
    }
    
    return forecast;
  }

  /**
   * 移动平均预测
   */
  static movingAverageForecast(data: DataPoint[], window: number, periods: number): DataPoint[] {
    if (data.length < window) return [];
    
    const forecast: DataPoint[] = [];
    const recentValues = data.slice(-window).map(d => d.value);
    const average = recentValues.reduce((sum, val) => sum + val, 0) / window;
    
    const lastTime = new Date(data[data.length - 1].time);
    
    for (let i = 1; i <= periods; i++) {
      const futureTime = new Date(lastTime.getTime() + i * 24 * 60 * 60 * 1000);
      
      forecast.push({
        time: futureTime,
        value: average,
        predicted: true,
        confidence: 0.7, // 固定置信度
      });
    }
    
    return forecast;
  }

  /**
   * 指数平滑预测
   */
  static exponentialSmoothingForecast(
    data: DataPoint[], 
    alpha: number = 0.3, 
    periods: number = 7
  ): DataPoint[] {
    if (data.length === 0) return [];
    
    // 计算指数平滑值
    let smoothedValue = data[0].value;
    for (let i = 1; i < data.length; i++) {
      smoothedValue = alpha * data[i].value + (1 - alpha) * smoothedValue;
    }
    
    const forecast: DataPoint[] = [];
    const lastTime = new Date(data[data.length - 1].time);
    
    for (let i = 1; i <= periods; i++) {
      const futureTime = new Date(lastTime.getTime() + i * 24 * 60 * 60 * 1000);
      
      forecast.push({
        time: futureTime,
        value: smoothedValue,
        predicted: true,
        confidence: 0.6,
      });
    }
    
    return forecast;
  }
}

// 数据分析管理器
export class DataAnalysisManager {
  /**
   * 综合数据分析
   */
  static async comprehensiveAnalysis(data: DataPoint[]): Promise<{
    statistics: StatisticalSummary;
    trend: AnalysisResult;
    seasonality: any;
    forecast: DataPoint[];
    outliers: any;
    recommendations: string[];
  }> {
    const cleanData = DataProcessor.cleanData(data);
    
    // 并行执行各种分析
    const [
      statistics,
      trend,
      seasonality,
      outliers,
    ] = await Promise.all([
      Promise.resolve(StatisticalAnalyzer.descriptiveStats(cleanData)),
      Promise.resolve(TrendAnalyzer.detectTrend(cleanData)),
      Promise.resolve(TrendAnalyzer.seasonalityAnalysis(cleanData)),
      Promise.resolve(DataProcessor.detectOutliers(cleanData)),
    ]);
    
    // 生成预测
    const forecast = ForecastAnalyzer.linearForecast(cleanData, 7);
    
    // 生成建议
    const recommendations = this.generateRecommendations(statistics, trend, seasonality, outliers);
    
    return {
      statistics,
      trend,
      seasonality,
      forecast,
      outliers,
      recommendations,
    };
  }

  /**
   * 生成数据分析建议
   */
  private static generateRecommendations(
    statistics: StatisticalSummary,
    trend: AnalysisResult,
    seasonality: any,
    outliers: any
  ): string[] {
    const recommendations: string[] = [];
    
    // 基于趋势的建议
    if (trend.trend === 'up' && trend.confidence > 70) {
      recommendations.push('数据呈现强劲上升趋势，建议保持当前策略');
    } else if (trend.trend === 'down' && trend.confidence > 70) {
      recommendations.push('数据呈现下降趋势，建议审视并调整策略');
    }
    
    // 基于波动性的建议
    const cv = (statistics.std / Math.abs(statistics.mean)) * 100;
    if (cv > 30) {
      recommendations.push('数据波动性较大，建议增加风险管理措施');
    }
    
    // 基于异常值的建议
    if (outliers.outliers.length > data.length * 0.05) {
      recommendations.push('存在较多异常值，建议检查数据质量和采集过程');
    }
    
    // 基于季节性的建议
    if (seasonality.hasSeasonality) {
      recommendations.push('数据存在季节性模式，建议制定相应的周期性策略');
    }
    
    return recommendations;
  }
}