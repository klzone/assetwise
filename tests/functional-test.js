/**
 * AssetWise 功能测试脚本
 * 全面测试应用的各个功能模块
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://luhqkfsdffkmpwqyjjyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aHFrZnNkZmZrbXB3cXlqanloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjUyNjgsImV4cCI6MjA2Mzc0MTI2OH0.AYG6ajoj2T30UKE-EE_PUwnQAAc5Y_tq6tWxXVmAqSA';

// 测试用户
const TEST_USER = {
  email: 'test@assetwise.demo',
  password: 'TestPassword123!'
};

class FunctionalTester {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.testResults = [];
    this.currentUser = null;
  }

  addResult(module, feature, status, message, data = null) {
    this.testResults.push({
      module,
      feature,
      status, // 'pass', 'fail', 'warning', 'info'
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // 认证模块测试
  async testAuthentication() {
    console.log('\n🔐 测试认证模块...');
    
    try {
      // 1. 测试注册功能
      console.log('1️⃣ 测试用户注册...');
      
      // 先尝试删除测试用户（如果存在）
      await this.supabase.auth.admin.deleteUser(TEST_USER.email).catch(() => {});
      
      const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
        email: TEST_USER.email,
        password: TEST_USER.password
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          this.addResult('认证', '用户注册', 'info', '测试用户已存在，继续测试');
        } else {
          this.addResult('认证', '用户注册', 'fail', `注册失败: ${signUpError.message}`);
          console.error('❌ 注册失败:', signUpError);
        }
      } else {
        this.addResult('认证', '用户注册', 'pass', '用户注册成功', signUpData.user);
        console.log('✅ 用户注册成功');
      }

      // 2. 测试登录功能
      console.log('2️⃣ 测试用户登录...');
      const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      });

      if (signInError) {
        this.addResult('认证', '用户登录', 'fail', `登录失败: ${signInError.message}`);
        console.error('❌ 登录失败:', signInError);
      } else {
        this.currentUser = signInData.user;
        this.addResult('认证', '用户登录', 'pass', '用户登录成功', {
          id: signInData.user.id,
          email: signInData.user.email
        });
        console.log('✅ 用户登录成功');
      }

      // 3. 测试获取用户信息
      console.log('3️⃣ 测试获取用户信息...');
      const { data: userData, error: userError } = await this.supabase.auth.getUser();

      if (userError) {
        this.addResult('认证', '获取用户信息', 'fail', `获取用户信息失败: ${userError.message}`);
        console.error('❌ 获取用户信息失败:', userError);
      } else {
        this.addResult('认证', '获取用户信息', 'pass', '获取用户信息成功', {
          id: userData.user.id,
          email: userData.user.email
        });
        console.log('✅ 获取用户信息成功');
      }

      // 4. 测试用户档案
      console.log('4️⃣ 测试用户档案...');
      if (this.currentUser) {
        const { data: profile, error: profileError } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', this.currentUser.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            this.addResult('认证', '用户档案', 'warning', '用户档案不存在，需要创建默认档案');
            console.log('⚠️ 用户档案不存在，需要创建默认档案');
            
            // 创建默认档案
            const defaultProfile = {
              id: this.currentUser.id,
              email: this.currentUser.email,
              username: this.currentUser.email.split('@')[0],
              subscription_type: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { data: newProfile, error: insertError } = await this.supabase
              .from('profiles')
              .insert(defaultProfile)
              .select()
              .single();

            if (insertError) {
              this.addResult('认证', '创建用户档案', 'fail', `创建用户档案失败: ${insertError.message}`);
              console.error('❌ 创建用户档案失败:', insertError);
            } else {
              this.addResult('认证', '创建用户档案', 'pass', '创建用户档案成功', newProfile);
              console.log('✅ 创建用户档案成功');
            }
          } else {
            this.addResult('认证', '用户档案', 'fail', `获取用户档案失败: ${profileError.message}`);
            console.error('❌ 获取用户档案失败:', profileError);
          }
        } else {
          this.addResult('认证', '用户档案', 'pass', '获取用户档案成功', profile);
          console.log('✅ 获取用户档案成功');
        }
      }

      // 5. 测试登出功能
      console.log('5️⃣ 测试用户登出...');
      const { error: signOutError } = await this.supabase.auth.signOut();

      if (signOutError) {
        this.addResult('认证', '用户登出', 'fail', `登出失败: ${signOutError.message}`);
        console.error('❌ 登出失败:', signOutError);
      } else {
        this.addResult('认证', '用户登出', 'pass', '用户登出成功');
        console.log('✅ 用户登出成功');
      }

    } catch (error) {
      this.addResult('认证', '整体测试', 'fail', `认证模块测试异常: ${error.message}`);
      console.error('💥 认证模块测试异常:', error);
    }
  }

  // 账户模块测试
  async testAccounts() {
    console.log('\n💰 测试账户模块...');
    
    try {
      // 先登录
      await this.supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      });

      // 1. 测试创建账户
      console.log('1️⃣ 测试创建账户...');
      const testAccount = {
        name: '测试账户',
        type: 'bank',
        currency: 'CNY',
        balance: 10000,
        user_id: this.currentUser?.id,
        description: '功能测试账户',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: accountData, error: accountError } = await this.supabase
        .from('accounts')
        .insert(testAccount)
        .select()
        .single();

      if (accountError) {
        this.addResult('账户', '创建账户', 'fail', `创建账户失败: ${accountError.message}`);
        console.error('❌ 创建账户失败:', accountError);
      } else {
        this.addResult('账户', '创建账户', 'pass', '创建账户成功', accountData);
        console.log('✅ 创建账户成功');
        
        // 2. 测试获取账户
        console.log('2️⃣ 测试获取账户...');
        const { data: accounts, error: getError } = await this.supabase
          .from('accounts')
          .select('*')
          .eq('user_id', this.currentUser?.id);

        if (getError) {
          this.addResult('账户', '获取账户', 'fail', `获取账户失败: ${getError.message}`);
          console.error('❌ 获取账户失败:', getError);
        } else {
          this.addResult('账户', '获取账户', 'pass', '获取账户成功', { count: accounts.length });
          console.log('✅ 获取账户成功，共', accounts.length, '个账户');
        }

        // 3. 测试更新账户
        console.log('3️⃣ 测试更新账户...');
        const { data: updateData, error: updateError } = await this.supabase
          .from('accounts')
          .update({ balance: 12000, description: '已更新的测试账户' })
          .eq('id', accountData.id)
          .select()
          .single();

        if (updateError) {
          this.addResult('账户', '更新账户', 'fail', `更新账户失败: ${updateError.message}`);
          console.error('❌ 更新账户失败:', updateError);
        } else {
          this.addResult('账户', '更新账户', 'pass', '更新账户成功', updateData);
          console.log('✅ 更新账户成功');
        }

        // 4. 测试删除账户
        console.log('4️⃣ 测试删除账户...');
        const { error: deleteError } = await this.supabase
          .from('accounts')
          .delete()
          .eq('id', accountData.id);

        if (deleteError) {
          this.addResult('账户', '删除账户', 'fail', `删除账户失败: ${deleteError.message}`);
          console.error('❌ 删除账户失败:', deleteError);
        } else {
          this.addResult('账户', '删除账户', 'pass', '删除账户成功');
          console.log('✅ 删除账户成功');
        }
      }

    } catch (error) {
      this.addResult('账户', '整体测试', 'fail', `账户模块测试异常: ${error.message}`);
      console.error('💥 账户模块测试异常:', error);
    } finally {
      // 登出
      await this.supabase.auth.signOut();
    }
  }

  // 资产模块测试
  async testAssets() {
    console.log('\n📊 测试资产模块...');
    
    try {
      // 先登录
      await this.supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      });

      // 创建测试账户
      const testAccount = {
        name: '资产测试账户',
        type: 'investment',
        currency: 'CNY',
        balance: 50000,
        user_id: this.currentUser?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: accountData } = await this.supabase
        .from('accounts')
        .insert(testAccount)
        .select()
        .single();

      // 1. 测试创建资产
      console.log('1️⃣ 测试创建资产...');
      const testAsset = {
        name: '测试股票',
        type: 'stock',
        symbol: 'TEST',
        quantity: 100,
        purchase_price: 88.88,
        current_price: 100.00,
        account_id: accountData.id,
        user_id: this.currentUser?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: assetData, error: assetError } = await this.supabase
        .from('assets')
        .insert(testAsset)
        .select()
        .single();

      if (assetError) {
        this.addResult('资产', '创建资产', 'fail', `创建资产失败: ${assetError.message}`);
        console.error('❌ 创建资产失败:', assetError);
      } else {
        this.addResult('资产', '创建资产', 'pass', '创建资产成功', assetData);
        console.log('✅ 创建资产成功');
        
        // 2. 测试获取资产
        console.log('2️⃣ 测试获取资产...');
        const { data: assets, error: getError } = await this.supabase
          .from('assets')
          .select('*')
          .eq('user_id', this.currentUser?.id);

        if (getError) {
          this.addResult('资产', '获取资产', 'fail', `获取资产失败: ${getError.message}`);
          console.error('❌ 获取资产失败:', getError);
        } else {
          this.addResult('资产', '获取资产', 'pass', '获取资产成功', { count: assets.length });
          console.log('✅ 获取资产成功，共', assets.length, '个资产');
        }

        // 3. 测试更新资产
        console.log('3️⃣ 测试更新资产...');
        const { data: updateData, error: updateError } = await this.supabase
          .from('assets')
          .update({ current_price: 120.00, quantity: 120 })
          .eq('id', assetData.id)
          .select()
          .single();

        if (updateError) {
          this.addResult('资产', '更新资产', 'fail', `更新资产失败: ${updateError.message}`);
          console.error('❌ 更新资产失败:', updateError);
        } else {
          this.addResult('资产', '更新资产', 'pass', '更新资产成功', updateData);
          console.log('✅ 更新资产成功');
        }

        // 4. 测试删除资产
        console.log('4️⃣ 测试删除资产...');
        const { error: deleteError } = await this.supabase
          .from('assets')
          .delete()
          .eq('id', assetData.id);

        if (deleteError) {
          this.addResult('资产', '删除资产', 'fail', `删除资产失败: ${deleteError.message}`);
          console.error('❌ 删除资产失败:', deleteError);
        } else {
          this.addResult('资产', '删除资产', 'pass', '删除资产成功');
          console.log('✅ 删除资产成功');
        }
      }

      // 清理测试账户
      await this.supabase
        .from('accounts')
        .delete()
        .eq('id', accountData.id);

    } catch (error) {
      this.addResult('资产', '整体测试', 'fail', `资产模块测试异常: ${error.message}`);
      console.error('💥 资产模块测试异常:', error);
    } finally {
      // 登出
      await this.supabase.auth.signOut();
    }
  }

  // 交易模块测试
  async testTransactions() {
    console.log('\n💸 测试交易模块...');
    
    try {
      // 先登录
      await this.supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      });

      // 创建测试账户
      const testAccount = {
        name: '交易测试账户',
        type: 'bank',
        currency: 'CNY',
        balance: 10000,
        user_id: this.currentUser?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: accountData } = await this.supabase
        .from('accounts')
        .insert(testAccount)
        .select()
        .single();

      // 1. 测试创建交易
      console.log('1️⃣ 测试创建交易...');
      const testTransaction = {
        type: 'expense',
        amount: 1000,
        description: '测试交易',
        category: 'test',
        transaction_date: new Date().toISOString(),
        account_id: accountData.id,
        user_id: this.currentUser?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: transactionData, error: transactionError } = await this.supabase
        .from('transactions')
        .insert(testTransaction)
        .select()
        .single();

      if (transactionError) {
        this.addResult('交易', '创建交易', 'fail', `创建交易失败: ${transactionError.message}`);
        console.error('❌ 创建交易失败:', transactionError);
      } else {
        this.addResult('交易', '创建交易', 'pass', '创建交易成功', transactionData);
        console.log('✅ 创建交易成功');
        
        // 2. 测试获取交易
        console.log('2️⃣ 测试获取交易...');
        const { data: transactions, error: getError } = await this.supabase
          .from('transactions')
          .select('*')
          .eq('user_id', this.currentUser?.id);

        if (getError) {
          this.addResult('交易', '获取交易', 'fail', `获取交易失败: ${getError.message}`);
          console.error('❌ 获取交易失败:', getError);
        } else {
          this.addResult('交易', '获取交易', 'pass', '获取交易成功', { count: transactions.length });
          console.log('✅ 获取交易成功，共', transactions.length, '笔交易');
        }

        // 3. 测试更新交易
        console.log('3️⃣ 测试更新交易...');
        const { data: updateData, error: updateError } = await this.supabase
          .from('transactions')
          .update({ amount: 1200, description: '已更新的测试交易' })
          .eq('id', transactionData.id)
          .select()
          .single();

        if (updateError) {
          this.addResult('交易', '更新交易', 'fail', `更新交易失败: ${updateError.message}`);
          console.error('❌ 更新交易失败:', updateError);
        } else {
          this.addResult('交易', '更新交易', 'pass', '更新交易成功', updateData);
          console.log('✅ 更新交易成功');
        }

        // 4. 测试删除交易
        console.log('4️⃣ 测试删除交易...');
        const { error: deleteError } = await this.supabase
          .from('transactions')
          .delete()
          .eq('id', transactionData.id);

        if (deleteError) {
          this.addResult('交易', '删除交易', 'fail', `删除交易失败: ${deleteError.message}`);
          console.error('❌ 删除交易失败:', deleteError);
        } else {
          this.addResult('交易', '删除交易', 'pass', '删除交易成功');
          console.log('✅ 删除交易成功');
        }
      }

      // 清理测试账户
      await this.supabase
        .from('accounts')
        .delete()
        .eq('id', accountData.id);

    } catch (error) {
      this.addResult('交易', '整体测试', 'fail', `交易模块测试异常: ${error.message}`);
      console.error('💥 交易模块测试异常:', error);
    } finally {
      // 登出
      await this.supabase.auth.signOut();
    }
  }

  // 数据同步测试
  async testDataSync() {
    console.log('\n🔄 测试数据同步模块...');
    
    // 这部分需要在前端环境中测试，这里只是模拟测试
    this.addResult('数据同步', '同步功能', 'info', '数据同步功能需要在前端环境中测试');
    console.log('ℹ️ 数据同步功能需要在前端环境中测试');
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📋 生成功能测试报告...\n');
    
    // 统计结果
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    const warnings = this.testResults.filter(r => r.status === 'warning').length;
    const info = this.testResults.filter(r => r.status === 'info').length;
    
    console.log('🎯 测试结果统计:');
    console.log(`- 总测试数: ${total}`);
    console.log(`- 通过: ${passed}`);
    console.log(`- 失败: ${failed}`);
    console.log(`- 警告: ${warnings}`);
    console.log(`- 信息: ${info}`);
    
    // 计算通过率
    const passRate = total > 0 ? Math.round((passed / (total - info)) * 100) : 0;
    console.log(`- 通过率: ${passRate}%`);
    
    // 按模块统计
    console.log('\n📊 各模块测试结果:');
    const modules = [...new Set(this.testResults.map(r => r.module))];
    
    modules.forEach(module => {
      const moduleResults = this.testResults.filter(r => r.module === module);
      const modulePassed = moduleResults.filter(r => r.status === 'pass').length;
      const moduleFailed = moduleResults.filter(r => r.status === 'fail').length;
      const moduleWarnings = moduleResults.filter(r => r.status === 'warning').length;
      const moduleInfo = moduleResults.filter(r => r.status === 'info').length;
      const modulePassRate = moduleResults.length - moduleInfo > 0 
        ? Math.round((modulePassed / (moduleResults.length - moduleInfo)) * 100) 
        : 0;
      
      console.log(`\n${module}模块:`);
      console.log(`- 测试数: ${moduleResults.length}`);
      console.log(`- 通过: ${modulePassed}`);
      console.log(`- 失败: ${moduleFailed}`);
      console.log(`- 警告: ${moduleWarnings}`);
      console.log(`- 信息: ${moduleInfo}`);
      console.log(`- 通过率: ${modulePassRate}%`);
    });
    
    // 失败的测试
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => r.status === 'fail')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.module} - ${result.feature}: ${result.message}`);
        });
    }
    
    // 警告
    if (warnings > 0) {
      console.log('\n⚠️ 警告:');
      this.testResults
        .filter(r => r.status === 'warning')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.module} - ${result.feature}: ${result.message}`);
        });
    }
    
    console.log('\n🎉 功能测试完成！');
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🧪 开始AssetWise功能测试...\n');
    
    try {
      await this.testAuthentication();
      await this.testAccounts();
      await this.testAssets();
      await this.testTransactions();
      await this.testDataSync();
      
      this.generateReport();
      
    } catch (error) {
      console.error('💥 测试过程中发生错误:', error);
    }
  }
}

// 运行功能测试
const tester = new FunctionalTester();
tester.runAllTests().catch(console.error);