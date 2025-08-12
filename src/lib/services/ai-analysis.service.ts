import { Account, Transaction, ReviewLog, Asset } from '@/lib/database';

// AI分析结果接口
export interface PortfolioAnalysis {
  totalValue: number;
  totalReturn: number;
  returnRate: number;
  riskLevel: 'low' | 'medium' | 'high';
  diversificationScore: number;
  assetAllocation: {
    stocks: number;
    funds: number;
    cash: number;
    crypto: number;
  };
  recommendations: string[];
}

export interface TradingBehaviorAnalysis {
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitLossRatio: number;
  tradingFrequency: 'low' | 'medium' | 'high';
  totalFees: number;
  feeImpact: number;
  recommendations: string[];
}

export interface EmotionalAnalysis {
  emotionDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  emotionTrend: 'improving' | 'stable' | 'declining';
  commonMistakes: string[];
  learningProgress: number;
  recommendations: string[];
}

export interface AIInsights {
  portfolioAnalysis: PortfolioAnalysis;
  tradingBehaviorAnalysis: TradingBehaviorAnalysis;
  emotionalAnalysis: EmotionalAnalysis;
  overallScore: number;
  keyRecommendations: string[];
  riskWarnings: string[];
}

export class AIAnalysisService {
  // 投资组合分析
  static analyzePortfolio(accounts: Account[], assets: Asset[], transactions: Transaction[]): PortfolioAnalysis {
    const totalValue = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    // 计算资产配置
    const assetAllocation = this.calculateAssetAllocation(accounts, assets);
    
    // 计算总收益
    const { totalReturn, returnRate } = this.calculateReturns(transactions);
    
    // 评估风险等级
    const riskLevel = this.assessRiskLevel(assetAllocation, transactions);
    
    // 计算分散化得分
    const diversificationScore = this.calculateDiversificationScore(assets);
    
    // 生成建议
    const recommendations = this.generatePortfolioRecommendations(
      assetAllocation, 
      riskLevel, 
      diversificationScore,
      returnRate
    );

    return {
      totalValue,
      totalReturn,
      returnRate,
      riskLevel,
      diversificationScore,
      assetAllocation,
      recommendations
    };
  }

  // 交易行为分析
  static analyzeTradingBehavior(transactions: Transaction[]): TradingBehaviorAnalysis {
    const totalTrades = transactions.length;
    
    // 计算盈亏统计
    const { winRate, avgProfit, avgLoss, profitLossRatio } = this.calculateWinLossStats(transactions);
    
    // 评估交易频率
    const tradingFrequency = this.assessTradingFrequency(transactions);
    
    // 计算手续费影响
    const totalFees = transactions.reduce((sum, t) => sum + (t.fee || 0) + (t.tax || 0), 0);
    const totalVolume = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const feeImpact = totalVolume > 0 ? (totalFees / totalVolume) * 100 : 0;
    
    // 生成建议
    const recommendations = this.generateTradingRecommendations(
      winRate,
      profitLossRatio,
      tradingFrequency,
      feeImpact
    );

    return {
      totalTrades,
      winRate,
      avgProfit,
      avgLoss,
      profitLossRatio,
      tradingFrequency,
      totalFees,
      feeImpact,
      recommendations
    };
  }

  // 情绪分析
  static analyzeEmotions(reviews: ReviewLog[]): EmotionalAnalysis {
    // 确保reviews是数组且不为空
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return {
        emotionDistribution: { positive: 0, neutral: 0, negative: 0 },
        emotionTrend: 'stable',
        commonMistakes: [],
        learningProgress: 0,
        recommendations: ['开始记录复盘日志以获得情绪分析']
      };
    }

    // 计算情绪分布
    const emotionDistribution = this.calculateEmotionDistribution(reviews);
    
    // 分析情绪趋势
    const emotionTrend = this.analyzeEmotionTrend(reviews);
    
    // 识别常见错误
    const commonMistakes = this.identifyCommonMistakes(reviews);
    
    // 计算学习进度
    const learningProgress = this.calculateLearningProgress(reviews);
    
    // 生成建议
    const recommendations = this.generateEmotionalRecommendations(
      emotionDistribution,
      emotionTrend,
      learningProgress
    );

    return {
      emotionDistribution,
      emotionTrend,
      commonMistakes,
      learningProgress,
      recommendations
    };
  }

  // 综合AI洞察
  static generateAIInsights(
    accounts: Account[],
    assets: Asset[],
    transactions: Transaction[],
    reviews: ReviewLog[]
  ): AIInsights {
    const portfolioAnalysis = this.analyzePortfolio(accounts, assets, transactions);
    const tradingBehaviorAnalysis = this.analyzeTradingBehavior(transactions);
    const emotionalAnalysis = this.analyzeEmotions(reviews);

    // 计算综合评分
    const overallScore = this.calculateOverallScore(
      portfolioAnalysis,
      tradingBehaviorAnalysis,
      emotionalAnalysis
    );

    // 生成关键建议
    const keyRecommendations = this.generateKeyRecommendations(
      portfolioAnalysis,
      tradingBehaviorAnalysis,
      emotionalAnalysis
    );

    // 生成风险警告
    const riskWarnings = this.generateRiskWarnings(
      portfolioAnalysis,
      tradingBehaviorAnalysis,
      emotionalAnalysis
    );

    return {
      portfolioAnalysis,
      tradingBehaviorAnalysis,
      emotionalAnalysis,
      overallScore,
      keyRecommendations,
      riskWarnings
    };
  }

  // 私有辅助方法
  private static calculateAssetAllocation(accounts: Account[], _assets: Asset[]) {
    const allocation = { stocks: 0, funds: 0, cash: 0, crypto: 0 };
    
    accounts.forEach(account => {
      allocation[account.type as keyof typeof allocation] += account.balance;
    });

    const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);

    if (total === 0) {
      return {
        stocks: 0,
        funds: 0,
        cash: 0,
        crypto: 0
      };
    }

    return {
      stocks: (allocation.stocks / total) * 100,
      funds: (allocation.funds / total) * 100,
      cash: (allocation.cash / total) * 100,
      crypto: (allocation.crypto / total) * 100
    };
  }

  private static calculateReturns(transactions: Transaction[]) {
    let totalInvested = 0;
    let totalCurrent = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'buy' || transaction.type === 'deposit') {
        totalInvested += transaction.amount;
        totalCurrent += transaction.amount;
      } else if (transaction.type === 'sell' || transaction.type === 'withdraw') {
        totalCurrent -= transaction.amount;
      }
    });

    const totalReturn = totalCurrent - totalInvested;
    const returnRate = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return { totalReturn, returnRate };
  }

  private static assessRiskLevel(
    assetAllocation: { stocks: number; funds: number; cash: number; crypto: number },
    _transactions: Transaction[]
  ): 'low' | 'medium' | 'high' {
    const stockRatio = assetAllocation.stocks;
    const cryptoRatio = assetAllocation.crypto;
    
    if (stockRatio > 70 || cryptoRatio > 30) return 'high';
    if (stockRatio > 40 || cryptoRatio > 10) return 'medium';
    return 'low';
  }

  private static calculateDiversificationScore(assets: Asset[]): number {
    if (assets.length === 0) return 0;
    
    // 简单的分散化评分：基于资产数量和类型
    const uniqueSymbols = new Set(assets.map(a => a.symbol)).size;
    const maxScore = 100;
    const score = Math.min((uniqueSymbols / 10) * maxScore, maxScore);
    
    return Math.round(score);
  }

  private static generatePortfolioRecommendations(
    allocation: { stocks: number; funds: number; cash: number; crypto: number },
    riskLevel: string,
    diversificationScore: number,
    returnRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (allocation.cash > 50) {
      recommendations.push('现金比例过高，考虑增加投资以获得更好收益');
    }

    if (diversificationScore < 30) {
      recommendations.push('投资组合分散度较低，建议增加不同类型的资产');
    }

    if (riskLevel === 'high') {
      recommendations.push('当前风险等级较高，建议适当降低高风险资产比例');
    }

    if (returnRate < -10) {
      recommendations.push('投资收益率偏低，建议重新评估投资策略');
    }

    return recommendations;
  }

  private static calculateWinLossStats(transactions: Transaction[]) {
    const trades = transactions.filter(t => t.type === 'sell');
    if (trades.length === 0) {
      return { winRate: 0, avgProfit: 0, avgLoss: 0, profitLossRatio: 0 };
    }

    let wins = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let profitTrades = 0;
    let lossTrades = 0;

    trades.forEach(trade => {
      const profit = trade.amount - ((trade.price || 0) * (trade.quantity || 0));
      if (profit > 0) {
        wins++;
        totalProfit += profit;
        profitTrades++;
      } else {
        totalLoss += Math.abs(profit);
        lossTrades++;
      }
    });

    const winRate = (wins / trades.length) * 100;
    const avgProfit = profitTrades > 0 ? totalProfit / profitTrades : 0;
    const avgLoss = lossTrades > 0 ? totalLoss / lossTrades : 0;
    const profitLossRatio = avgLoss > 0 ? avgProfit / avgLoss : 0;

    return { winRate, avgProfit, avgLoss, profitLossRatio };
  }

  private static assessTradingFrequency(transactions: Transaction[]): 'low' | 'medium' | 'high' {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentTrades = transactions.filter(t =>
      new Date(t.transaction_date) >= thirtyDaysAgo
    );

    const tradesPerMonth = recentTrades.length;

    if (tradesPerMonth > 20) return 'high';
    if (tradesPerMonth > 5) return 'medium';
    return 'low';
  }

  private static generateTradingRecommendations(
    winRate: number,
    profitLossRatio: number,
    frequency: string,
    feeImpact: number
  ): string[] {
    const recommendations: string[] = [];

    if (winRate < 40) {
      recommendations.push('胜率较低，建议重新评估选股策略和买卖时机');
    }

    if (profitLossRatio < 1) {
      recommendations.push('盈亏比不理想，建议设置更严格的止损和止盈策略');
    }

    if (frequency === 'high') {
      recommendations.push('交易频率较高，注意避免过度交易');
    }

    if (feeImpact > 2) {
      recommendations.push('手续费成本较高，建议优化交易策略以降低成本');
    }

    return recommendations;
  }

  private static calculateEmotionDistribution(reviews: ReviewLog[]) {
    const distribution = { positive: 0, neutral: 0, negative: 0 };

    // 确保reviews是数组
    if (!Array.isArray(reviews)) {
      return distribution;
    }

    reviews.forEach(review => {
      const emotion = (review.emotion_score || 0) > 6 ? 'positive' : (review.emotion_score || 0) < 4 ? 'negative' : 'neutral';
      distribution[emotion as keyof typeof distribution]++;
    });

    const total = reviews.length;
    return {
      positive: (distribution.positive / total) * 100,
      neutral: (distribution.neutral / total) * 100,
      negative: (distribution.negative / total) * 100
    };
  }

  private static analyzeEmotionTrend(reviews: ReviewLog[]): 'improving' | 'stable' | 'declining' {
    if (reviews.length < 3) return 'stable';

    const recent = reviews.slice(-5);
    const earlier = reviews.slice(-10, -5);

    const recentPositive = recent.filter(r => (r.emotion_score || 0) > 6).length / recent.length;
    const earlierPositive = earlier.length > 0 ?
      earlier.filter(r => (r.emotion_score || 0) > 6).length / earlier.length : recentPositive;

    if (recentPositive > earlierPositive + 0.1) return 'improving';
    if (recentPositive < earlierPositive - 0.1) return 'declining';
    return 'stable';
  }

  private static identifyCommonMistakes(reviews: ReviewLog[]): string[] {
    const mistakes: string[] = [];
    const negativeReviews = reviews.filter(r => (r.emotion_score || 0) < 4);

    // 简单的关键词分析
    const commonPatterns = [
      { pattern: /追高|FOMO/i, mistake: '追高买入' },
      { pattern: /恐慌|panic/i, mistake: '恐慌性抛售' },
      { pattern: /贪心|贪婪/i, mistake: '贪心不止盈' },
      { pattern: /止损/i, mistake: '未及时止损' }
    ];

    commonPatterns.forEach(({ pattern, mistake }) => {
      const count = negativeReviews.filter(r =>
        pattern.test(r.content || '') || pattern.test(r.title || '')
      ).length;

      if (count >= 2) {
        mistakes.push(mistake);
      }
    });

    return mistakes;
  }

  private static calculateLearningProgress(reviews: ReviewLog[]): number {
    if (reviews.length < 2) return 0;

    const recentReviews = reviews.slice(-5);
    const hasLessons = recentReviews.filter(r => r.content && r.content.length > 50).length;
    const hasPlans = recentReviews.filter(r => r.title && r.title.length > 10).length;

    const progressScore = ((hasLessons + hasPlans) / (recentReviews.length * 2)) * 100;
    return Math.round(progressScore);
  }

  private static generateEmotionalRecommendations(
    distribution: { positive: number; neutral: number; negative: number },
    trend: string,
    progress: number
  ): string[] {
    const recommendations: string[] = [];

    if (distribution.negative > 50) {
      recommendations.push('负面情绪较多，建议调整投资心态，制定更合理的预期');
    }

    if (trend === 'declining') {
      recommendations.push('情绪趋势下降，建议暂停交易，重新审视投资策略');
    }

    if (progress < 30) {
      recommendations.push('复盘质量有待提高，建议更详细地记录经验教训和改进计划');
    }

    return recommendations;
  }

  private static calculateOverallScore(
    portfolio: PortfolioAnalysis,
    trading: TradingBehaviorAnalysis,
    emotional: EmotionalAnalysis
  ): number {
    let score = 0;

    // 投资组合评分 (40%)
    score += Math.max(0, Math.min(100, portfolio.returnRate + 50)) * 0.2;
    score += portfolio.diversificationScore * 0.2;

    // 交易行为评分 (40%)
    score += Math.min(100, trading.winRate) * 0.2;
    score += Math.min(100, trading.profitLossRatio * 20) * 0.2;

    // 情绪管理评分 (20%)
    score += emotional.emotionDistribution.positive * 0.1;
    score += emotional.learningProgress * 0.1;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private static generateKeyRecommendations(
    portfolio: PortfolioAnalysis,
    trading: TradingBehaviorAnalysis,
    emotional: EmotionalAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // 从各个分析中选择最重要的建议
    if (portfolio.recommendations.length > 0) {
      recommendations.push(portfolio.recommendations[0]);
    }

    if (trading.recommendations.length > 0) {
      recommendations.push(trading.recommendations[0]);
    }

    if (emotional.recommendations.length > 0) {
      recommendations.push(emotional.recommendations[0]);
    }

    return recommendations.slice(0, 3);
  }

  private static generateRiskWarnings(
    portfolio: PortfolioAnalysis,
    trading: TradingBehaviorAnalysis,
    emotional: EmotionalAnalysis
  ): string[] {
    const warnings: string[] = [];

    if (portfolio.riskLevel === 'high') {
      warnings.push('投资组合风险等级较高，请注意风险控制');
    }

    if (trading.winRate < 30) {
      warnings.push('交易胜率过低，建议暂停交易并重新制定策略');
    }

    if (emotional.emotionDistribution.negative > 60) {
      warnings.push('负面情绪过多，可能影响投资决策，建议寻求专业指导');
    }

    return warnings;
  }
}
