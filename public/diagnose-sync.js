
/**
 * 同步问题诊断脚本
 * 在浏览器控制台中运行此脚本来诊断同步问题
 */

async function diagnoseSyncIssues() {
  console.log('🔍 开始诊断同步问题...')
  
  // 检查本地存储
  console.log('\n1. 检查本地存储数据...')
  const localData = localStorage.getItem('assetwise_assets')
  if (localData) {
    try {
      const parsed = JSON.parse(localData)
      console.log('✅ 本地数据存在:', parsed.assets?.length || 0, '项资产')
      console.log('   本地数据示例:', parsed.assets?.[0])
    } catch (error) {
      console.error('❌ 本地数据格式错误:', error)
    }
  } else {
    console.log('❌ 本地无数据')
  }
  
  // 检查 Supabase 连接
  console.log('\n2. 检查 Supabase 连接...')
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase 环境变量未配置')
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ Supabase 连接失败:', error.message)
    } else if (user) {
      console.log('✅ Supabase 连接正常，用户已登录:', user.email)
    } else {
      console.log('⚠️ Supabase 连接正常，但用户未登录')
    }
  } catch (error) {
    console.error('❌ Supabase 模块加载失败:', error)
  }
  
  // 检查同步函数
  console.log('\n3. 检查同步函数...')
  if (typeof window !== 'undefined' && window.assetStorage) {
    console.log('✅ assetStorage 对象存在')
    if (typeof window.assetStorage.syncToCloud === 'function') {
      console.log('✅ syncToCloud 函数存在')
    } else {
      console.log('❌ syncToCloud 函数不存在')
    }
  } else {
    console.log('❌ assetStorage 对象不存在')
  }
  
  console.log('\n🎉 诊断完成!')
}

// 运行诊断
diagnoseSyncIssues()
