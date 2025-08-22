/**
 * 数据同步调试脚本
 * 用于测试本地数据上传到云端的功能
 */

const { createClient } = require('@supabase/supabase-js')

// Supabase 配置
const supabaseUrl = 'https://luhqkfsdffkmpwqyjjyh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aHFrZnNkZmZrbXB3cXlqanloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjUyNjgsImV4cCI6MjA2Mzc0MTI2OH0.AYG6ajoj2T30UKE-EE_PUwnQAAc5Y_tq6tWxXVmAqSA'

async function testSyncFunction() {
  console.log('🔍 开始调试数据同步功能...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. 检查用户认证状态
    console.log('\n1. 检查用户认证状态...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ 获取用户信息失败:', userError.message)
      console.log('💡 请确保用户已登录')
      return
    }
    
    if (!user) {
      console.error('❌ 用户未登录')
      console.log('💡 请先在应用中登录，然后重新运行此脚本')
      return
    }
    
    console.log('✅ 用户已登录:', user.email)
    console.log('   用户ID:', user.id)
    
    // 2. 检查数据库表结构
    console.log('\n2. 检查数据库表结构...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('assets')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ 访问assets表失败:', tableError.message)
      console.log('💡 可能需要运行数据库迁移脚本')
      return
    }
    
    console.log('✅ assets表访问正常')
    
    // 3. 查看现有数据
    console.log('\n3. 查看云端现有数据...')
    const { data: existingAssets, error: selectError } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
    
    if (selectError) {
      console.error('❌ 查询现有数据失败:', selectError.message)
      return
    }
    
    console.log(`✅ 云端现有资产数量: ${existingAssets?.length || 0}`)
    if (existingAssets && existingAssets.length > 0) {
      console.log('   现有资产:')
      existingAssets.forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset.name} (${asset.symbol}) - ${asset.type}`)
      })
    }
    
    // 4. 测试插入新数据
    console.log('\n4. 测试插入新资产数据...')
    const testAsset = {
      id: `test_${Date.now()}`,
      user_id: user.id,
      name: '测试资产',
      symbol: 'TEST',
      type: 'stock',
      current_price: 100.00,
      average_cost: 90.00,
      quantity: 10,
      total_value: 1000.00,
      profit_loss: 100.00,
      profit_loss_percentage: 11.11,
      day_change: 5.00,
      day_change_rate: 5.26,
      allocation: 100.00,
      risk_level: 'medium',
      last_updated: new Date().toISOString()
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('assets')
      .upsert([testAsset], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
    
    if (insertError) {
      console.error('❌ 插入测试数据失败:', insertError.message)
      console.log('   错误详情:', insertError)
      
      // 检查是否是字段问题
      if (insertError.message.includes('column') || insertError.message.includes('does not exist')) {
        console.log('💡 可能是数据库表结构问题，请运行迁移脚本:')
        console.log('   cd assetwise-app && npx supabase db push')
      }
      return
    }
    
    console.log('✅ 测试数据插入成功!')
    console.log('   插入的数据:', insertData)
    
    // 5. 清理测试数据
    console.log('\n5. 清理测试数据...')
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .eq('id', testAsset.id)
    
    if (deleteError) {
      console.warn('⚠️ 清理测试数据失败:', deleteError.message)
    } else {
      console.log('✅ 测试数据清理完成')
    }
    
    // 6. 检查本地存储数据格式
    console.log('\n6. 本地数据格式建议...')
    console.log('💡 确保本地资产数据包含以下字段:')
    console.log('   - id: 字符串类型的唯一标识符')
    console.log('   - name: 资产名称')
    console.log('   - symbol: 资产代码')
    console.log('   - category: 资产分类（需要映射到数据库的type字段）')
    console.log('   - currentPrice: 当前价格')
    console.log('   - purchasePrice: 购买价格（映射到average_cost）')
    console.log('   - quantity: 数量')
    console.log('   - totalValue: 总价值')
    console.log('   - profitLoss: 盈亏金额')
    console.log('   - profitLossPercent: 盈亏百分比')
    
    console.log('\n🎉 同步功能调试完成!')
    console.log('💡 如果本地数据仍无法上传，请检查:')
    console.log('   1. 用户是否已登录')
    console.log('   2. 本地数据格式是否正确')
    console.log('   3. 网络连接是否正常')
    console.log('   4. 数据库表结构是否最新')
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error)
  }
}

// 运行调试
testSyncFunction()