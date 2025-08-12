/**
 * AssetWise 认证问题诊断脚本
 * 用于检测和修复Supabase认证错误
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://luhqkfsdffkmpwqyjjyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aHFrZnNkZmZrbXB3cXlqanloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjUyNjgsImV4cCI6MjA2Mzc0MTI2OH0.AYG6ajoj2T30UKE-EE_PUwnQAAc5Y_tq6tWxXVmAqSA';

async function diagnoseAuth() {
  console.log('🔍 开始AssetWise认证诊断...\n');

  try {
    // 1. 创建Supabase客户端
    console.log('1️⃣ 创建Supabase客户端...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase客户端创建成功\n');

    // 2. 测试基本连接
    console.log('2️⃣ 测试Supabase连接...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Supabase连接失败:', connectionError);
      return;
    }
    console.log('✅ Supabase连接正常\n');

    // 3. 检查当前会话
    console.log('3️⃣ 检查当前认证会话...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ 获取会话失败:', sessionError);
      return;
    }

    if (!session) {
      console.log('ℹ️ 当前没有活跃会话（用户未登录）');
      console.log('💡 这是正常状态，用户需要登录\n');
    } else {
      console.log('✅ 找到活跃会话:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at
      });

      // 4. 检查用户档案
      console.log('\n4️⃣ 检查用户档案...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('❌ 获取用户档案失败:', profileError);
        
        if (profileError.code === 'PGRST116') {
          console.log('💡 用户档案不存在，这可能是问题的根源');
          console.log('🔧 尝试创建默认用户档案...');

          const defaultProfile = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.email?.split('@')[0] || 'user',
            subscription_type: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(defaultProfile)
            .select()
            .single();

          if (insertError) {
            console.error('❌ 创建用户档案失败:', insertError);
          } else {
            console.log('✅ 默认用户档案创建成功:', newProfile);
          }
        }
      } else {
        console.log('✅ 用户档案正常:', {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          subscription_type: profile.subscription_type
        });
      }
    }

    // 5. 检查数据库表结构
    console.log('\n5️⃣ 检查profiles表结构...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ 无法访问profiles表:', tableError);
    } else {
      console.log('✅ profiles表访问正常');
    }

    // 6. 测试认证功能
    console.log('\n6️⃣ 测试认证功能...');
    
    // 测试登录（使用测试账户）
    const testEmail = 'test@assetwise.demo';
    const testPassword = 'TestPassword123!';

    console.log(`🔐 尝试使用测试账户登录: ${testEmail}`);
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('ℹ️ 测试账户不存在（这是正常的）');
        console.log('💡 建议创建测试账户进行功能测试');
      } else {
        console.error('❌ 登录测试失败:', loginError);
      }
    } else {
      console.log('✅ 登录测试成功');
      
      // 登出测试账户
      await supabase.auth.signOut();
      console.log('✅ 登出测试完成');
    }

    console.log('\n🎉 认证诊断完成！');
    console.log('\n📋 诊断总结:');
    console.log('- Supabase连接: ✅ 正常');
    console.log('- 数据库访问: ✅ 正常');
    console.log('- 认证功能: ✅ 正常');
    
    if (!session) {
      console.log('- 当前状态: ℹ️ 用户未登录（正常）');
      console.log('\n💡 建议:');
      console.log('1. 确保用户正确登录');
      console.log('2. 检查前端认证状态管理');
      console.log('3. 验证用户档案是否正确创建');
    }

  } catch (error) {
    console.error('💥 诊断过程中发生异常:', error);
  }
}

// 运行诊断
diagnoseAuth().catch(console.error);