#!/usr/bin/env node

/**
 * 简化的测试数据准备脚本
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://luhqkfsdffkmpwqyjjyh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aHFrZnNkZmZrbXB3cXlqanloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjUyNjgsImV4cCI6MjA2Mzc0MTI2OH0.AYG6ajoj2T30UKE-EE_PUwnQAAc5Y_tq6tWxXVmAqSA'
);

async function setupTestData() {
  console.log('🚀 开始准备测试数据...');
  
  try {
    // 检查现有数据
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    console.log(`📊 当前用户数量: ${profiles?.length || 0}`);
    
    if (profiles && profiles.length > 0) {
      const userId = profiles[0].id;
      console.log(`✅ 使用现有用户进行测试: ${profiles[0].email}`);
      
      // 检查账户数据
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);
      
      console.log(`📊 用户账户数量: ${accounts?.length || 0}`);
      
      // 检查资产数据
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId);
      
      console.log(`📊 用户资产数量: ${assets?.length || 0}`);
      
      // 检查交易数据
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);
      
      console.log(`📊 交易记录数量: ${transactions?.length || 0}`);
      
      console.log('✅ 测试数据准备完成！');
      
      return {
        userId,
        userEmail: profiles[0].email,
        accountsCount: accounts?.length || 0,
        assetsCount: assets?.length || 0,
        transactionsCount: transactions?.length || 0
      };
    } else {
      console.log('❌ 没有找到现有用户数据');
      return null;
    }
    
  } catch (error) {
    console.error('❌ 准备测试数据失败:', error.message);
    return null;
  }
}

if (require.main === module) {
  setupTestData();
}

module.exports = { setupTestData };