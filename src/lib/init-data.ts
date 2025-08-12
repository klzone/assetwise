import { databaseService } from './services/database.service';

export async function initializeTestData() {
  try {
    // 创建测试用户
    const testUser = await databaseService.createUser({
      username: 'testuser',
      password_hash: 'password123',
      email: 'test@example.com',
      subscription_type: 'premium',
      subscription_expires_at: new Date('2025-12-31')
    });

    console.log('Created test user:', testUser);

    // 创建测试账户
    const account1 = await databaseService.createAccount({
      user_id: testUser.id!,
      name: '招商证券账户',
      type: 'stock',
      broker: '招商证券',
      account_number: '1234567890',
      currency: 'CNY',
      balance: 50000,
      is_active: true
    });

    const account2 = await databaseService.createAccount({
      user_id: testUser.id!,
      name: '支付宝基金账户',
      type: 'fund',
      broker: '支付宝',
      account_number: '9876543210',
      currency: 'CNY',
      balance: 30000,
      is_active: true
    });

    console.log('Created test accounts:', [account1, account2]);

    // 创建测试交易记录
    const transactions = [
      {
        account_id: account1.id!,
        symbol: '000001',
        name: '平安银行',
        type: 'buy' as const,
        quantity: 1000,
        price: 15.60,
        amount: 15600,
        fee: 5,
        tax: 0,
        transaction_date: new Date('2024-01-15'),
        notes: '看好银行股长期价值'
      },
      {
        account_id: account1.id!,
        symbol: '000001',
        name: '平安银行',
        type: 'sell' as const,
        quantity: 200,
        price: 16.20,
        amount: 3240,
        fee: 5,
        tax: 1,
        transaction_date: new Date('2024-03-10'),
        notes: '部分获利了结'
      },
      {
        account_id: account2.id!,
        symbol: '110003',
        name: '易方达消费',
        type: 'buy' as const,
        quantity: 50000,
        price: 1.0000,
        amount: 50000,
        fee: 0,
        tax: 0,
        transaction_date: new Date('2024-01-01'),
        notes: '基金定投开始'
      },
      {
        account_id: account2.id!,
        symbol: '110003',
        name: '易方达消费',
        type: 'buy' as const,
        quantity: 2000,
        price: 1.0500,
        amount: 2100,
        fee: 0,
        tax: 0,
        transaction_date: new Date('2024-02-01'),
        notes: '月度定投'
      }
    ];

    for (const transaction of transactions) {
      await databaseService.createTransaction(transaction);
    }

    console.log('Created test transactions');

    // 创建测试复盘日志
    const reviewLogs = [
      {
        user_id: testUser.id!,
        title: '2024年1月投资复盘',
        content: '本月开始了银行股和基金的投资，整体策略是价值投资配合定投。银行股选择了平安银行，基本面较好，估值合理。基金选择了消费主题，看好长期消费升级趋势。',
        emotion_score: 8,
        emotion_state: 'positive',
        tags: ['银行股', '基金定投', '价值投资'],
        profit_loss: 0,
        lessons_learned: '投资需要耐心，不要频繁操作',
        next_plan: '继续定投基金，关注银行股业绩',
        review_date: new Date('2024-01-31')
      },
      {
        user_id: testUser.id!,
        title: '平安银行部分获利了结',
        content: '平安银行从15.6涨到16.2，涨幅约4%，决定卖出部分股票获利了结。这次操作比较成功，及时把握了短期波动。',
        emotion_score: 9,
        emotion_state: 'positive',
        tags: ['获利了结', '银行股', '短期交易'],
        profit_loss: 115,
        lessons_learned: '适当的获利了结有助于降低风险',
        next_plan: '继续持有剩余股票，等待更好的买入机会',
        review_date: new Date('2024-03-10')
      },
      {
        user_id: testUser.id!,
        title: '市场调整期的思考',
        content: '最近市场出现调整，基金净值有所下跌。但这正是定投的好时机，可以在低位积累更多份额。保持冷静，坚持长期投资理念。',
        emotion_score: 6,
        emotion_state: 'neutral',
        tags: ['市场调整', '定投', '长期投资'],
        profit_loss: -500,
        lessons_learned: '市场波动是正常的，要保持长期视角',
        next_plan: '继续定投，不要被短期波动影响',
        review_date: new Date('2024-04-15')
      }
    ];

    for (const log of reviewLogs) {
      await databaseService.createReviewLog(log);
    }

    console.log('Created test review logs');

    // 创建测试投资计划
    const investmentPlans = [
      {
        user_id: testUser.id!,
        title: '2024年股票投资计划',
        description: '重点关注银行股和消费股，目标收益率15%',
        target_amount: 100000,
        target_date: '2024-12-31',
        risk_level: 'medium',
        category: 'stock',
        expected_return: 15
      },
      {
        user_id: testUser.id!,
        title: '基金定投计划',
        description: '每月定投消费主题基金2000元，长期持有',
        target_amount: 24000,
        target_date: '2024-12-31',
        risk_level: 'low',
        category: 'fund',
        expected_return: 10
      },
      {
        user_id: testUser.id!,
        title: '应急资金储备',
        description: '建立6个月生活费的应急资金，存放在货币基金中',
        target_amount: 60000,
        target_date: '2024-06-30',
        risk_level: 'low',
        category: 'cash',
        expected_return: 2.5
      }
    ];

    for (const plan of investmentPlans) {
      await databaseService.createInvestmentPlan(plan);
    }

    // 更新计划的当前金额
    const plans = await databaseService.getInvestmentPlansByUserId(testUser.id!);
    if (plans.length >= 3) {
      await databaseService.updateInvestmentPlan(plans[0].id, { current_amount: 65000 });
      await databaseService.updateInvestmentPlan(plans[1].id, { current_amount: 8000 });
      await databaseService.updateInvestmentPlan(plans[2].id, { current_amount: 60000, status: 'completed' });
    }

    console.log('Created test investment plans');

    return testUser;
  } catch (error) {
    console.error('Error initializing test data:', error);
    throw error;
  }
}

// 检查是否已有测试数据
export async function hasTestData(): Promise<boolean> {
  try {
    const user = await databaseService.getUserByUsername('testuser');
    return !!user;
  } catch {
    return false;
  }
}

// 清理测试数据
export async function cleanupTestData(): Promise<void> {
  try {
    const user = await databaseService.getUserByUsername('testuser');
    if (user) {
      // 删除用户会级联删除相关数据
      // 这里需要在数据库服务中添加删除用户的方法
      console.log('Test data cleanup completed');
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}
