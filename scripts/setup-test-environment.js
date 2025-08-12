#!/usr/bin/env node

/**
 * AssetWise 测试环境设置脚本
 * 用于建立完整的测试环境和准备测试数据
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase配置
const SUPABASE_URL = 'https://luhqkfsdffkmpwqyjjyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aHFrZnNkZmZrbXB3cXlqanloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjUyNjgsImV4cCI6MjA2Mzc0MTI2OH0.AYG6ajoj2T30UKE-EE_PUwnQAAc5Y_tq6tWxXVmAqSA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 测试用户数据
const TEST_USERS = [
  {
    email: 'test.user1@assetwise.test',
    password: 'TestPassword123!',
    username: 'testuser1',
    full_name: '测试用户一',
    subscription_type: 'professional'
  },
  {
    email: 'test.user2@assetwise.test', 
    password: 'TestPassword123!',
    username: 'testuser2',
    full_name: '测试用户二',
    subscription_type: 'free'
  },
  {
    email: 'test.admin@assetwise.test',
    password: 'AdminPassword123!',
    username: 'testadmin',
    full_name: '测试管理员',
    subscription_type: 'flagship'
  }
];

// 测试账户数据
const TEST_ACCOUNTS = [
  {
    name: '招商证券账户',
    type: 'securities',
    broker: '招商证券',
    account_number: 'ZS001234567',
    currency: 'CNY',
    balance: 100000.00,
    description: '主要股票交易账户'
  },
  {
    name: '支付宝余额宝',
    type: 'fund',
    broker: '支付宝',
    account_number: 'YEB987654321',
    currency: 'CNY', 
    balance: 50000.00,
    description: '货币基金账户'
  },
  {
    name: 'Binance加密货币',
    type: 'crypto',
    broker: 'Binance',
    account_number: 'BN123456789',
    currency: 'USDT',
    balance: 10000.00,
    description: '加密货币交易账户'
  }
];

// 测试资产数据
const TEST_ASSETS = [
  {
    symbol: '000001.SZ',
    name: '平安银行',
    type: 'stock',
    current_price: 12.50,
    quantity: 1000,
    average_cost: 11.80,
    total_value: 12500.00,
    profit_loss: 700.00,
    profit_loss_percentage: 5.93
  },
  {
    symbol: 'BTC',
    name: '比特币',
    type: 'crypto',
    current_price: 45000.00,
    quantity: 0.5,
    average_cost: 42000.00,
    total_value: 22500.00,
    profit_loss: 1500.00,
    profit_loss_percentage: 7.14
  },
  {
    symbol: '510300.SH',
    name: '沪深300ETF',
    type: 'fund',
    current_price: 4.85,
    quantity: 10000,
    average_cost: 4.60,
    total_value: 48500.00,
    profit_loss: 2500.00,
    profit_loss_percentage: 5.43
  }
];

// 测试交易数据
const TEST_TRANSACTIONS = [
  {
    type: 'buy',
    symbol: '000001.SZ',
    name: '平安银行',
    quantity: 1000,
    price: 11.80,
    amount: 11800.00,
    fee: 5.90,
    tax: 0,
    notes: '建仓买入',
    transaction_date: '2024-01-15'
  },
  {
    type: 'buy',
    symbol: 'BTC',
    name: '比特币',
    quantity: 0.5,
    price: 42000.00,
    amount: 21000.00,
    fee: 21.00,
    tax: 0,
    notes: '加密货币投资',
    transaction_date: '2024-01-20'
  },
  {
    type: 'dividend',
    symbol: '000001.SZ',
    name: '平安银行',
    quantity: null,
    price: null,
    amount: 100.00,
    fee: 0,
    tax: 10.00,
    notes: '股息收入',
    transaction_date: '2024-02-01'
  }
];

// 测试投资计划数据
const TEST_INVESTMENT_PLANS = [
  {
    title: '2024年股票投资计划',
    description: '专注于银行股和科技股的长期投资',
    target_amount: 200000.00,
    current_amount: 50000.00,
    target_date: '2024-12-31',
    status: 'active',
    risk_level: 'medium',
    category: 'stock',
    expected_return: 15.0,
    actual_return: 8.5
  },
  {
    title: '加密货币投资组合',
    description: '分散投资主流加密货币',
    target_amount: 50000.00,
    current_amount: 25000.00,
    target_date: '2024-06-30',
    status: 'active',
    risk_level: 'high',
    category: 'crypto',
    expected_return: 30.0,
    actual_return: 12.0
  }
];

// 测试复盘数据
const TEST_REVIEWS = [
  {
    title: '2024年1月投资复盘',
    content: '本月主要完成了银行股的建仓，整体表现符合预期。市场波动较大，但长期看好银行板块的价值投资机会。',
    tags: ['银行股', '价值投资', '月度复盘'],
    performance_rating: 4,
    lessons_learned: '需要更好地控制仓位，避免单一股票占比过高',
    review_date: '2024-01-31'
  },
  {
    title: '加密货币投资策略调整',
    content: '基于市场变化，调整了加密货币的投资策略，减少了高风险币种的配置。',
    tags: ['加密货币', '策略调整', '风险控制'],
    performance_rating: 3,
    lessons_learned: '加密货币市场波动性极大，需要严格的风险管理',
    review_date: '2024-02-15'
  }
];

/**
 * 清理现有测试数据
 */
async function cleanupTestData() {
  console.log('🧹 清理现有测试数据...');
  
  try {
    // 删除测试用户相关的所有数据
    const testEmails = TEST_USERS.map(user => user.email);
    
    // 获取测试用户ID
    const { data: testUsers } = await supabase
      .from('profiles')
      .select('id')
      .in('email', testEmails);
    
    if (testUsers && testUsers.length > 0) {
      const testUserIds = testUsers.map(user => user.id);
      
      // 删除相关数据（按依赖关系顺序）
      await supabase.from('reviews').delete().in('user_id', testUserIds);
      await supabase.from('investment_plans').delete().in('user_id', testUserIds);
      await supabase.from('transactions').delete().in('user_id', testUserIds);
      await supabase.from('assets').delete().in('user_id', testUserIds);
      await supabase.from('accounts').delete().in('user_id', testUserIds);
      await supabase.from('profiles').delete().in('id', testUserIds);
      
      console.log(`✅ 已清理 ${testUserIds.length} 个测试用户的数据`);
    }
  } catch (error) {
    console.warn('⚠️ 清理测试数据时出现错误:', error.message);
  }
}

/**
 * 创建测试用户
 */
async function createTestUsers() {
  console.log('👥 创建测试用户...');
  
  const createdUsers = [];
  
  for (const userData of TEST_USERS) {
    try {
      // 注册用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.full_name
          }
        }
      });
      
      if (authError) {
        console.error(`❌ 创建用户 ${userData.email} 失败:`, authError.message);
        continue;
      }
      
      if (authData.user) {
        // 创建用户档案
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: userData.email,
            username: userData.username,
            full_name: userData.full_name,
            subscription_type: userData.subscription_type
          });
        
        if (profileError) {
          console.error(`❌ 创建用户档案 ${userData.email} 失败:`, profileError.message);
        } else {
          createdUsers.push({
            id: authData.user.id,
            email: userData.email,
            username: userData.username
          });
          console.log(`✅ 创建用户: ${userData.email} (${userData.username})`);
        }
      }
    } catch (error) {
      console.error(`❌ 创建用户 ${userData.email} 时出现异常:`, error.message);
    }
  }
  
  return createdUsers;
}

/**
 * 创建测试数据
 */
async function createTestData(users) {
  console.log('📊 创建测试数据...');
  
  for (const user of users) {
    try {
      console.log(`📝 为用户 ${user.username} 创建测试数据...`);
      
      // 创建账户
      const createdAccounts = [];
      for (const accountData of TEST_ACCOUNTS) {
        const { data: account, error } = await supabase
          .from('accounts')
          .insert({
            ...accountData,
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) {
          console.error(`❌ 创建账户失败:`, error.message);
        } else {
          createdAccounts.push(account);
          console.log(`  ✅ 创建账户: ${accountData.name}`);
        }
      }
      
      // 创建资产
      for (let i = 0; i < TEST_ASSETS.length && i < createdAccounts.length; i++) {
        const assetData = TEST_ASSETS[i];
        const account = createdAccounts[i];
        
        const { error } = await supabase
          .from('assets')
          .insert({
            ...assetData,
            user_id: user.id,
            account_id: account.id
          });
        
        if (error) {
          console.error(`❌ 创建资产失败:`, error.message);
        } else {
          console.log(`  ✅ 创建资产: ${assetData.name}`);
        }
      }
      
      // 创建交易记录
      for (let i = 0; i < TEST_TRANSACTIONS.length && i < createdAccounts.length; i++) {
        const transactionData = TEST_TRANSACTIONS[i];
        const account = createdAccounts[i % createdAccounts.length];
        
        const { error } = await supabase
          .from('transactions')
          .insert({
            ...transactionData,
            user_id: user.id,
            account_id: account.id
          });
        
        if (error) {
          console.error(`❌ 创建交易记录失败:`, error.message);
        } else {
          console.log(`  ✅ 创建交易: ${transactionData.type} ${transactionData.name}`);
        }
      }
      
      // 创建投资计划
      for (const planData of TEST_INVESTMENT_PLANS) {
        const { error } = await supabase
          .from('investment_plans')
          .insert({
            ...planData,
            user_id: user.id
          });
        
        if (error) {
          console.error(`❌ 创建投资计划失败:`, error.message);
        } else {
          console.log(`  ✅ 创建投资计划: ${planData.title}`);
        }
      }
      
      // 创建复盘记录
      for (const reviewData of TEST_REVIEWS) {
        const { error } = await supabase
          .from('reviews')
          .insert({
            ...reviewData,
            user_id: user.id
          });
        
        if (error) {
          console.error(`❌ 创建复盘记录失败:`, error.message);
        } else {
          console.log(`  ✅ 创建复盘: ${reviewData.title}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ 为用户 ${user.username} 创建数据时出现异常:`, error.message);
    }
  }
}

/**
 * 验证测试数据
 */
async function verifyTestData() {
  console.log('🔍 验证测试数据...');
  
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('email', TEST_USERS.map(u => u.email));
    
    console.log(`📊 数据统计:`);
    console.log(`  - 用户档案: ${profiles?.length || 0}`);
    
    if (profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.id);
      
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .in('user_id', userIds);
      
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .in('user_id', userIds);
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds);
      
      const { data: plans } = await supabase
        .from('investment_plans')
        .select('*')
        .in('user_id', userIds);
      
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .in('user_id', userIds);
      
      console.log(`  - 账户: ${accounts?.length || 0}`);
      console.log(`  - 资产: ${assets?.length || 0}`);
      console.log(`  - 交易记录: ${transactions?.length || 0}`);
      console.log(`  - 投资计划: ${plans?.length || 0}`);
      console.log(`  - 复盘记录: ${reviews?.length || 0}`);
    }
    
    console.log('✅ 测试数据验证完成');
    
  } catch (error) {
    console.error('❌ 验证测试数据失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 AssetWise 测试环境设置开始...\n');
  
  try {
    // 1. 清理现有测试数据
    await cleanupTestData();
    console.log('');
    
    // 2. 创建测试用户
    const users = await createTestUsers();
    console.log('');
    
    if (users.length === 0) {
      console.log('❌ 没有成功创建任何测试用户，退出设置');
      return;
    }
    
    // 3. 创建测试数据
    await createTestData(users);
    console.log('');
    
    // 4. 验证测试数据
    await verifyTestData();
    console.log('');
    
    console.log('🎉 测试环境设置完成！');
    console.log('\n📋 测试账户信息:');
    TEST_USERS.forEach(user => {
      console.log(`  - ${user.email} / ${user.password} (${user.subscription_type})`);
    });
    
    console.log('\n🔧 下一步操作:');
    console.log('  1. 运行功能测试: npm test');
    console.log('  2. 启动开发服务器: npm run dev');
    console.log('  3. 使用测试账户登录进行手动测试');
    
  } catch (error) {
    console.error('❌ 测试环境设置失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  TEST_USERS,
  TEST_ACCOUNTS,
  TEST_ASSETS,
  TEST_TRANSACTIONS,
  TEST_INVESTMENT_PLANS,
  TEST_REVIEWS,
  cleanupTestData,
  createTestUsers,
  createTestData,
  verifyTestData
};