# 数据同步问题排查指南

## 问题现象
本地有6个资产数据，点击同步按钮后，云端 Supabase 数据库仍只有2条数据，说明本地数据没有成功上传到云端。

## 根本原因分析

### 1. 用户认证问题 ⚠️
**最可能的原因**：用户未登录或认证状态丢失
- 测试脚本显示：`Auth session missing!`
- 同步功能需要用户登录状态才能工作

### 2. 数据库表结构问题
- 原始表结构使用 UUID 类型的 ID，但代码生成的是字符串 ID
- 缺少一些字段如 `day_change`、`day_change_rate`、`allocation` 等

### 3. 字段映射问题
- 代码中的字段名与数据库字段名不完全匹配
- 资产分类映射到数据库枚举类型需要正确转换

## 解决方案

### 步骤 1：检查用户登录状态
1. 打开应用，确保用户已登录
2. 检查浏览器开发者工具 -> Application -> Local Storage
3. 查看是否有 Supabase 相关的认证 token

### 步骤 2：执行数据库迁移
```bash
# 在 assetwise-app 目录下执行
./run-migration.sh
```

或者手动执行：
```bash
npx supabase db push
```

### 步骤 3：重启开发服务器
```bash
pnpm dev
```

### 步骤 4：测试同步功能
1. 确保用户已登录
2. 在资产页面点击同步按钮
3. 观察浏览器控制台的日志输出

## 调试工具

### 1. 浏览器控制台诊断
在浏览器开发者工具控制台中运行：
```javascript
// 检查本地数据
const localData = localStorage.getItem('assetwise_assets')
console.log('本地数据:', localData ? JSON.parse(localData) : '无数据')

// 检查认证状态
import('@supabase/supabase-js').then(({ createClient }) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return supabase.auth.getUser()
}).then(({ data: { user }, error }) => {
  console.log('用户状态:', user ? `已登录: ${user.email}` : '未登录')
  if (error) console.error('认证错误:', error)
})
```

### 2. 网络请求监控
1. 打开开发者工具 -> Network 标签
2. 点击同步按钮
3. 查看是否有发送到 Supabase 的请求
4. 检查请求状态码和响应内容

## 常见错误及解决方法

### 错误 1: "Auth session missing!"
**解决方法**：
1. 重新登录应用
2. 清除浏览器缓存和 Local Storage
3. 检查 Supabase 项目配置

### 错误 2: "column does not exist"
**解决方法**：
1. 执行数据库迁移脚本
2. 检查表结构是否正确

### 错误 3: "duplicate key value violates unique constraint"
**解决方法**：
1. 检查资产 ID 是否重复
2. 使用 upsert 而不是 insert

### 错误 4: "permission denied"
**解决方法**：
1. 检查 RLS 策略是否正确
2. 确保用户有权限访问资产表

## 预防措施

### 1. 添加错误处理
在同步函数中添加详细的错误日志：
```typescript
try {
  // 同步逻辑
} catch (error) {
  console.error('同步失败详细信息:', {
    error: error.message,
    stack: error.stack,
    userData: user,
    assetsCount: assets.length
  })
}
```

### 2. 添加重试机制
```typescript
async function syncWithRetry(assets, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await syncToCloud(assets)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 3. 添加同步状态指示
在 UI 中显示详细的同步状态和错误信息。

## 验证步骤

完成修复后，按以下步骤验证：

1. **登录验证**：确保用户已成功登录
2. **本地数据验证**：确认本地有6个资产数据
3. **同步测试**：点击同步按钮，观察控制台日志
4. **云端验证**：检查 Supabase 数据库中的数据数量
5. **功能测试**：添加新资产，测试是否能正常同步

## 联系支持

如果问题仍然存在，请提供以下信息：
- 浏览器控制台的完整错误日志
- 网络请求的详细信息
- 用户登录状态截图
- Supabase 数据库表结构截图