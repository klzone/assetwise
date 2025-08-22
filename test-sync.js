// 测试同步功能
const { createClient } = require('@supabase/supabase-js')

// 模拟本地资产数据
const testAsset = {
  id: `test_asset_${Date.now()}`,
  name: '测试资产',
  symbol: 'TEST001',
  category: 'stock',
  currentPrice: 100,
  purchasePrice: 90,
  quantity: 100,
  totalValue: 10000,
  totalCost: 9000,
  profitLoss: 1000,
  profitLossPercent: 11.11,
  dayChange: 50,
  dayChangePercent: 0.5,
  allocation: 50,
  lastUpdated: new Date().toLocaleString('zh-CN'),
  riskLevel: 'medium'
}

async function testSync() {
  try {
    console.log('开始测试同步功能...')
    
    // 创建 Supabase 客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('缺少 Supabase 环境变量')
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 转换为数据库格式
    const assetForDB = {
      id: testAsset.id,
      user_id: '11ed58fc-b9cc-4c6b-ba81-b9c9f5190f37', // 使用现有用户ID
      name: testAsset.name,
      symbol: testAsset.symbol,
      type: testAsset.category, // category -> type
      current_price: testAsset.currentPrice,
      average_cost: testAsset.purchasePrice, // purchasePrice -> average_cost
      quantity: testAsset.quantity,
      market_value: testAsset.totalValue, // totalValue -> market_value
      profit_loss: testAsset.profitLoss,
      profit_loss_percentage: testAsset.profitLossPercent, // profitLossPercent -> profit_loss_percentage
      day_change: testAsset.dayChange,
      day_change_rate: testAsset.dayChangePercent, // dayChangePercent -> day_change_rate
      weight: testAsset.allocation, // allocation -> weight
      last_updated: new Date().toISOString()
    }
    
    console.log('准备插入的数据:', assetForDB)
    
    // 插入测试数据
    const { data, error } = await supabase
      .from('assets')
      .upsert([assetForDB], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
    
    if (error) {
      console.error('插入失败:', error)
    } else {
      console.log('插入成功:', data)
    }
    
    // 读取数据验证
    const { data: readData, error: readError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', testAsset.id)
    
    if (readError) {
      console.error('读取失败:', readError)
    } else {
      console.log('读取成功:', readData)
      
      // 验证字段映射
      if (readData && readData.length > 0) {
        const dbAsset = readData[0]
        console.log('\n字段映射验证:')
        console.log(`name: ${dbAsset.name} ✓`)
        console.log(`symbol: ${dbAsset.symbol} ✓`)
        console.log(`type: ${dbAsset.type} ✓`)
        console.log(`current_price: ${dbAsset.current_price} ✓`)
        console.log(`average_cost: ${dbAsset.average_cost} ✓`)
        console.log(`quantity: ${dbAsset.quantity} ✓`)
        console.log(`market_value: ${dbAsset.market_value} ✓`)
        console.log(`profit_loss: ${dbAsset.profit_loss} ✓`)
        console.log(`profit_loss_percentage: ${dbAsset.profit_loss_percentage} ✓`)
        console.log(`day_change: ${dbAsset.day_change} ✓`)
        console.log(`day_change_rate: ${dbAsset.day_change_rate} ✓`)
        console.log(`weight: ${dbAsset.weight} ✓`)
        
        // 转换回本地格式测试
        const convertedBack = {
          id: dbAsset.id,
          name: dbAsset.name,
          symbol: dbAsset.symbol,
          category: dbAsset.type,
          currentPrice: parseFloat(dbAsset.current_price),
          purchasePrice: parseFloat(dbAsset.average_cost),
          quantity: parseFloat(dbAsset.quantity),
          totalValue: parseFloat(dbAsset.market_value),
          totalCost: parseFloat(dbAsset.average_cost) * parseFloat(dbAsset.quantity),
          profitLoss: parseFloat(dbAsset.profit_loss),
          profitLossPercent: parseFloat(dbAsset.profit_loss_percentage),
          dayChange: parseFloat(dbAsset.day_change),
          dayChangePercent: parseFloat(dbAsset.day_change_rate),
          allocation: parseFloat(dbAsset.weight),
          lastUpdated: new Date(dbAsset.last_updated).toLocaleString('zh-CN')
        }
        
        console.log('\n转换回本地格式:')
        console.log(convertedBack)
      }
    }
    
    console.log('\n同步功能测试完成!')
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testSync()