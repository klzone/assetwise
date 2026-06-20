/**
 * 天天基金组合导入和更新服务
 */

export interface TiantianFundHolding {
  name: string;
  code?: string;
  nav: number;
  dailyChange: number;
  weight: number;
  type: string; // 混合型、债券型、指数型、货币型
}

export interface TiantianFundPortfolio {
  name: string;
  type: string;
  totalValue: number;
  totalReturn: number;
  totalReturnRate: number;
  weeklyReturn: number;
  nav: number;
  holdings: TiantianFundHolding[];
  url: string;
  lastUpdated: string;
}

export class TiantianFundImportService {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  
  /**
   * 从天天基金链接导入组合数据
   */
  async importFromUrl(url: string): Promise<TiantianFundPortfolio> {
    try {
      // 提取SubAccountNo
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const subAccountNo = urlParams.get('SubAccountNo');
      
      if (!subAccountNo) {
        throw new Error('无效的天天基金组合链接');
      }

      // 构建API请求URL（这里需要根据实际的天天基金API来调整）
      const apiUrl = `https://tradeapilvs1.1234567.com.cn/User/SubA/SubAProfit`;
      
      // 由于跨域限制，这里提供一个模拟的解析方法
      // 实际使用时可能需要后端代理或者其他方式获取数据
      const portfolioData = await this.parsePortfolioFromUrl(url);
      
      return portfolioData;
    } catch (error) {
      console.error('导入天天基金组合失败:', error);
      throw new Error('导入失败，请检查链接是否正确');
    }
  }

  /**
   * 解析组合页面数据（模拟实现）
   */
  private async parsePortfolioFromUrl(url: string): Promise<TiantianFundPortfolio> {
    // 由于跨域限制，这里提供一个基于URL参数的模拟解析
    // 实际项目中可能需要：
    // 1. 后端代理服务
    // 2. 浏览器插件
    // 3. 用户手动复制数据
    
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const subAccountNo = urlParams.get('SubAccountNo');
    
    // 尝试从localStorage获取缓存的数据
    const cachedData = this.getCachedPortfolioData(subAccountNo || '');
    if (cachedData && this.isDataFresh(cachedData.lastUpdated)) {
      return cachedData;
    }
    
    // 模拟数据（基于您提供的组合页面）
    const mockData: TiantianFundPortfolio = {
      name: '养老计划',
      type: '稳健型',
      totalValue: 3087.03,
      totalReturn: 87.03,
      totalReturnRate: 4.40,
      weeklyReturn: 1.71,
      nav: 1.0440,
      url: url,
      lastUpdated: new Date().toISOString(),
      holdings: [
        // 混合型基金
        {
          name: '东方红新动力混合C',
          code: '009480',
          nav: 5.4830,
          dailyChange: 0.33,
          weight: 8.67,
          type: '混合型'
        },
        {
          name: '富国天恒混合A',
          code: '000029',
          nav: 1.3482,
          dailyChange: 0.36,
          weight: 8.07,
          type: '混合型'
        },
        {
          name: '博时研究慧选混合C',
          code: '011966',
          nav: 1.5476,
          dailyChange: 0.06,
          weight: 7.86,
          type: '混合型'
        },
        {
          name: '国联优势产业混合C',
          code: '012756',
          nav: 1.0942,
          dailyChange: 0.39,
          weight: 7.79,
          type: '混合型'
        },
        {
          name: '博道久航混合C',
          code: '011683',
          nav: 1.6488,
          dailyChange: -0.12,
          weight: 7.56,
          type: '混合型'
        },
        // 债券型基金
        {
          name: '广发景宁债券C',
          code: '003223',
          nav: 1.1788,
          dailyChange: 0.00,
          weight: 9.94,
          type: '债券型'
        },
        {
          name: '安信鑫日享中短债C',
          code: '006517',
          nav: 1.1219,
          dailyChange: 0.00,
          weight: 4.99,
          type: '债券型'
        },
        // 指数型基金
        {
          name: '华宝标普港股通低波红利ETF联接C',
          code: '007336',
          nav: 1.1669,
          dailyChange: 0.31,
          weight: 5.86,
          type: '指数型'
        },
        {
          name: '南方红利低波50ETF联接C',
          code: '008736',
          nav: 1.1103,
          dailyChange: 0.44,
          weight: 3.73,
          type: '指数型'
        },
        {
          name: '易方达中证银行ETF联接(LOF)A',
          code: '001594',
          nav: 1.6982,
          dailyChange: 0.57,
          weight: 3.62,
          type: '指数型'
        },
        // 货币型基金
        {
          name: '华宝现金宝货币A',
          code: '511990',
          nav: 0.2877,
          dailyChange: 0.00,
          weight: 1.42,
          type: '货币型'
        }
      ]
    };

    // 缓存数据
    this.cachePortfolioData(subAccountNo || '', mockData);
    
    return mockData;
  }

  /**
   * 缓存投资组合数据
   */
  private cachePortfolioData(subAccountNo: string, data: TiantianFundPortfolio): void {
    try {
      const cacheKey = `tiantian_portfolio_${subAccountNo}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.warn('缓存天天基金数据失败:', error);
    }
  }

  /**
   * 获取缓存的投资组合数据
   */
  private getCachedPortfolioData(subAccountNo: string): TiantianFundPortfolio | null {
    try {
      const cacheKey = `tiantian_portfolio_${subAccountNo}`;
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('读取缓存的天天基金数据失败:', error);
      return null;
    }
  }

  /**
   * 检查数据是否新鲜（5分钟内）
   */
  private isDataFresh(lastUpdated: string): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastUpdated) > fiveMinutesAgo;
  }

  /**
   * 强制刷新数据
   */
  async forceRefreshPortfolio(url: string): Promise<TiantianFundPortfolio> {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const subAccountNo = urlParams.get('SubAccountNo');
    
    // 清除缓存
    if (subAccountNo) {
      const cacheKey = `tiantian_portfolio_${subAccountNo}`;
      localStorage.removeItem(cacheKey);
    }
    
    // 重新获取数据
    return this.parsePortfolioFromUrl(url);
  }

  /**
   * 更新组合净值数据
   */
  async updatePortfolioData(url: string): Promise<TiantianFundPortfolio> {
    try {
      // 重新获取最新数据
      const updatedData = await this.parsePortfolioFromUrl(url);
      return updatedData;
    } catch (error) {
      console.error('更新组合数据失败:', error);
      throw new Error('更新失败，请检查网络连接');
    }
  }

  /**
   * 获取基金代码（从基金名称推断）
   */
  private extractFundCode(fundName: string): string {
    // 这里可以维护一个基金名称到代码的映射表
    // 或者通过API查询获取
    const fundCodeMap: { [key: string]: string } = {
      '东方红新动力混合C': '009480',
      '富国天恒混合A': '000029',
      '博时研究慧选混合C': '011966',
      '国联优势产业混合C': '012756',
      '博道久航混合C': '011683',
      '广发景宁债券C': '003223',
      '安信鑫日享中短债C': '006517',
      '华宝标普港股通低波红利ETF联接C': '007336',
      '南方红利低波50ETF联接C': '008736',
      '易方达中证银行ETF联接(LOF)A': '001594',
      '华宝现金宝货币A': '511990'
    };

    return fundCodeMap[fundName] || '';
  }

  /**
   * 验证天天基金链接格式
   */
  validateTiantianUrl(url: string): boolean {
    const tiantianUrlPattern = /^https:\/\/tradeh5\.tiantianfunds\.cn\/tradeh5\/[a-f0-9]+\/indexindex\?SubAccountNo=\d+$/;
    return tiantianUrlPattern.test(url);
  }

  /**
   * 提取SubAccountNo
   */
  extractSubAccountNo(url: string): string | null {
    try {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      return urlParams.get('SubAccountNo');
    } catch {
      return null;
    }
  }

  /**
   * 转换为AssetWise基金组合格式
   */
  convertToAssetWiseFormat(tiantianData: TiantianFundPortfolio): any {
    const totalValue = tiantianData.totalValue;
    
    return {
      id: `tiantian_${this.extractSubAccountNo(tiantianData.url)}`,
      name: `${tiantianData.name}（天天基金）`,
      description: `从天天基金导入的${tiantianData.type}组合`,
      totalValue: totalValue,
      totalProfit: tiantianData.totalReturn,
      totalProfitRate: tiantianData.totalReturnRate,
      holdings: tiantianData.holdings.map((holding, index) => ({
        id: `holding_${Date.now()}_${index}`,
        code: holding.code || this.extractFundCode(holding.name),
        name: holding.name,
        nav: holding.nav,
        holdingAmount: (totalValue * holding.weight) / 100,
        shares: ((totalValue * holding.weight) / 100) / holding.nav,
        costPrice: holding.nav * (1 - holding.dailyChange / 100), // 估算成本价
        profit: (totalValue * holding.weight) / 100 * (holding.dailyChange / 100),
        profitRate: holding.dailyChange,
        weight: holding.weight,
        assetType: 'fund' as const,
        fundType: holding.type
      })),
      portfolioType: 'fund' as const,
      tiantianUrl: tiantianData.url,
      createdAt: new Date().toISOString(),
      updatedAt: tiantianData.lastUpdated
    };
  }

  /**
   * 同步天天基金组合到本地存储
   */
  async syncToLocalStorage(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // 获取天天基金数据
      const tiantianData = await this.importFromUrl(url);
      
      // 转换为AssetWise格式
      const portfolioData = this.convertToAssetWiseFormat(tiantianData);
      
      // 保存到本地存储
      const existingPortfolios = JSON.parse(localStorage.getItem('assetwise_portfolios') || '[]');
      
      // 检查是否已存在相同的天天基金组合
      const existingIndex = existingPortfolios.findIndex((p: any) => 
        p.tiantianUrl === url || p.id === portfolioData.id
      );
      
      if (existingIndex >= 0) {
        // 更新现有组合
        existingPortfolios[existingIndex] = {
          ...existingPortfolios[existingIndex],
          ...portfolioData,
          updatedAt: new Date().toISOString()
        };
      } else {
        // 添加新组合
        existingPortfolios.push(portfolioData);
      }
      
      localStorage.setItem('assetwise_portfolios', JSON.stringify(existingPortfolios));
      
      return { success: true, data: portfolioData };
    } catch (error) {
      console.error('同步天天基金组合失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '同步失败' };
    }
  }

  /**
   * 批量更新所有天天基金组合
   */
  async updateAllTiantianPortfolios(): Promise<{ success: boolean; updated: number; errors: string[] }> {
    try {
      const existingPortfolios = JSON.parse(localStorage.getItem('assetwise_portfolios') || '[]');
      const tiantianPortfolios = existingPortfolios.filter((p: any) => p.tiantianUrl);
      
      let updated = 0;
      const errors: string[] = [];
      
      for (const portfolio of tiantianPortfolios) {
        try {
          const result = await this.syncToLocalStorage(portfolio.tiantianUrl);
          if (result.success) {
            updated++;
          } else {
            errors.push(`${portfolio.name}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`${portfolio.name}: ${error instanceof Error ? error.message : '更新失败'}`);
        }
      }
      
      return { success: true, updated, errors };
    } catch (error) {
      console.error('批量更新天天基金组合失败:', error);
      return { success: false, updated: 0, errors: [error instanceof Error ? error.message : '批量更新失败'] };
    }
  }
}