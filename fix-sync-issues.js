/**
 * 修复数据同步问题的脚本
 * 解决本地数据无法上传到云端的问题
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 开始修复数据同步问题...')

// 1. 检查环境变量配置
console.log('\n1. 检查环境变量配置...')
const envPath = path.join(__dirname, '.env.local')

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL') && envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log('✅ 环境变量配置正确')
  } else {
    console.log('❌ 环境变量配置不完整')
    console.log('💡 请确保 .env.local 文件包含:')
    console.log('   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url')
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
  }
} else {
  console.log('❌ 未找到 .env.local 文件')
  console.log('💡 请创建 .env.local 文件并配置 Supabase 连接信息')
}

// 2. 检查关键文件是否存在
console.log('\n2. 检查关键文件...')
const criticalFiles = [
  'src/lib/asset-storage.ts',
  'src/components/sync/local-data-upload-dialog.tsx',
  'src/lib/sqlite-sync-helper.ts'
]

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} 存在`)
  } else {
    console.log(`❌ ${file} 不存在`)
  }
})

// 3. 创建数据库迁移执行脚本
console.log('\n3. 创建数据库迁移执行脚本...')
const migrationScript = `#!/bin/bash
# 执行数据库迁移以修复表结构

echo "🔄 开始执行数据库迁移..."

# 检查是否安装了 Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装"
    echo "💡 请先安装 Supabase CLI:"
    echo "   npm install -g supabase"
    exit 1
fi

# 执行迁移
echo "📤 推送数据库迁移..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移执行成功!"
else
    echo "❌ 数据库迁移执行失败"
    echo "💡 请检查 Supabase 项目配置和网络连接"
fi
`

fs.writeFileSync(path.join(__dirname, 'run-migration.sh'), migrationScript)
fs.chmodSync(path.join(__dirname, 'run-migration.sh'), '755')
console.log('✅ 创建了 run-migration.sh 脚本')

// 4. 创建同步问题诊断脚本
console.log('\n4. 创建同步问题诊断脚本...')
const diagnosticScript = `
/**
 * 同步问题诊断脚本
 * 在浏览器控制台中运行此脚本来诊断同步问题
 */

async function diagnoseSyncIssues() {
  console.log('🔍 开始诊断同步问题...')
  
  // 检查本地存储
  console.log('\\n1. 检查本地存储数据...')
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
  console.log('\\n2. 检查 Supabase 连接...')
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
  console.log('\\n3. 检查同步函数...')
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
  
  console.log('\\n🎉 诊断完成!')
}

// 运行诊断
diagnoseSyncIssues()
`

fs.writeFileSync(path.join(__dirname, 'public/diagnose-sync.js'), diagnosticScript)
console.log('✅ 创建了 public/diagnose-sync.js 诊断脚本')

// 5. 提供修复建议
console.log('\n🎯 修复建议:')
console.log('1. 运行数据库迁移:')
console.log('   ./run-migration.sh')
console.log('')
console.log('2. 重启开发服务器:')
console.log('   pnpm dev')
console.log('')
console.log('3. 在浏览器中运行诊断脚本:')
console.log('   打开开发者工具 -> 控制台 -> 加载 /diagnose-sync.js')
console.log('')
console.log('4. 测试同步功能:')
console.log('   node test-sync-debug.js')
console.log('')
console.log('5. 如果问题仍然存在，请检查:')
console.log('   - 用户是否已登录')
console.log('   - 网络连接是否正常')
console.log('   - Supabase 项目是否正常运行')
console.log('   - 数据库表结构是否正确')

console.log('\n✅ 修复脚本执行完成!')