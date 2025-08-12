# AssetWise 数据库迁移和测试指南

## 🚀 数据库重建步骤

### 1. **备份现有数据**
```bash
# 备份当前数据库（如果有重要数据）
pg_dump -h your-host -U your-user -d your-database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. **执行新Schema**
```bash
# 在Supabase控制台或通过psql执行
psql -h your-host -U your-user -d your-database -f supabase/schema-new.sql
```

### 3. **验证表结构**
```sql
-- 检查所有表是否创建成功
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 检查字段是否正确
\d public.profiles
\d public.accounts
\d public.transactions
\d public.reviews
\d public.assets
\d public.investment_plans
```

## 📋 字段映射对照表

### Profiles表字段映射
| 旧字段 | 新字段 | 类型变化 | 说明 |
|--------|--------|----------|------|
| ✅ id | id | 无变化 | UUID |
| ✅ email | email | 无变化 | TEXT |
| ✅ username | username | 无变化 | TEXT |
| ✅ full_name | full_name | 无变化 | TEXT |
| ✅ avatar_url | avatar_url | 无变化 | TEXT |
| ❌ - | **phone** | **新增** | TEXT |
| ❌ - | **location** | **新增** | TEXT |
| ❌ - | **bio** | **新增** | TEXT |
| ✅ subscription_type | subscription_type | 无变化 | ENUM |
| ✅ subscription_expires_at | subscription_expires_at | 无变化 | TIMESTAMPTZ |

### Reviews表字段映射
| 旧字段 | 新字段 | 类型变化 | 说明 |
|--------|--------|----------|------|
| ✅ id | id | UUID→BIGINT | 改为数字ID |
| ✅ title | title | 无变化 | TEXT |
| ✅ content | content | 无变化 | TEXT |
| ✅ tags | tags | 无变化 | TEXT[] |
| ❌ performance_rating | **emotion_score** | **替换** | INTEGER (1-10) |
| ❌ - | **mood** | **新增** | ENUM |
| ❌ - | **related_transactions** | **新增** | BIGINT[] |
| ✅ lessons_learned | lessons_learned | 无变化 | TEXT |
| ❌ - | **next_plan** | **新增** | TEXT |
| ❌ - | **profit** | **新增** | DECIMAL |
| ❌ - | **profit_rate** | **新增** | DECIMAL |

### Accounts表字段映射
| 旧字段 | 新字段 | 类型变化 | 说明 |
|--------|--------|----------|------|
| ✅ id | id | UUID→BIGINT | 改为数字ID |
| ✅ name | name | 无变化 | TEXT |
| ✅ type | type | 无变化 | ENUM |
| ✅ broker | broker | 无变化 | TEXT |
| ✅ account_number | account_number | 无变化 | TEXT |
| ✅ currency | currency | 无变化 | TEXT |
| ✅ balance | balance | 无变化 | DECIMAL |
| ✅ description | description | 无变化 | TEXT |

### Transactions表字段映射
| 旧字段 | 新字段 | 类型变化 | 说明 |
|--------|--------|----------|------|
| ✅ id | id | UUID→BIGINT | 改为数字ID |
| ✅ account_id | account_id | UUID→BIGINT | 改为数字ID |
| ✅ type | type | 扩展ENUM | 添加split, merge |
| ✅ symbol | symbol | 无变化 | TEXT |
| ✅ name | name | 无变化 | TEXT |
| ✅ quantity | quantity | 无变化 | DECIMAL |
| ✅ price | price | 无变化 | DECIMAL |
| ✅ amount | amount | 无变化 | DECIMAL |
| ✅ fee | fee | 无变化 | DECIMAL |
| ✅ tax | tax | 无变化 | DECIMAL |

### Assets表字段映射
| 旧字段 | 新字段 | 类型变化 | 说明 |
|--------|--------|----------|------|
| ✅ id | id | UUID→BIGINT | 改为数字ID |
| ✅ account_id | account_id | UUID→BIGINT | 改为数字ID |
| ✅ total_value | market_value | 重命名 | DECIMAL |
| ✅ profit_loss | profit_loss | 无变化 | DECIMAL |
| ✅ profit_loss_percentage | profit_loss_percentage | 无变化 | DECIMAL |
| ❌ - | **day_change** | **新增** | DECIMAL |
| ❌ - | **day_change_rate** | **新增** | DECIMAL |
| ❌ - | **weight** | **新增** | DECIMAL |
| ❌ - | **volatility** | **新增** | DECIMAL |
| ❌ - | **beta** | **新增** | DECIMAL |
| ❌ - | **sharpe_ratio** | **新增** | DECIMAL |
| ❌ - | **max_drawdown** | **新增** | DECIMAL |

## 🔄 数据迁移脚本

### 如果需要保留现有数据，使用以下迁移脚本：

```sql
-- 1. 迁移用户档案数据
INSERT INTO public.profiles_new (
  id, email, username, full_name, avatar_url, 
  subscription_type, subscription_expires_at, created_at, updated_at
)
SELECT 
  id, email, username, full_name, avatar_url,
  subscription_type, subscription_expires_at, created_at, updated_at
FROM public.profiles_old;

-- 2. 迁移账户数据（UUID转数字ID需要映射表）
CREATE TEMP TABLE account_id_mapping AS
SELECT 
  old_id,
  ROW_NUMBER() OVER (ORDER BY created_at) as new_id
FROM public.accounts_old;

INSERT INTO public.accounts_new (
  id, user_id, name, type, broker, account_number, 
  currency, balance, description, is_active, created_at, updated_at
)
SELECT 
  m.new_id, a.user_id, a.name, a.type, a.broker, a.account_number,
  a.currency, a.balance, a.description, a.is_active, a.created_at, a.updated_at
FROM public.accounts_old a
JOIN account_id_mapping m ON a.id = m.old_id;

-- 3. 迁移交易数据
INSERT INTO public.transactions_new (
  user_id, account_id, type, symbol, name, quantity, price, amount,
  fee, tax, notes, transaction_date, created_at, updated_at
)
SELECT 
  t.user_id, m.new_id, t.type, t.symbol, t.name, t.quantity, t.price, t.amount,
  t.fee, t.tax, t.notes, t.transaction_date, t.created_at, t.updated_at
FROM public.transactions_old t
JOIN account_id_mapping m ON t.account_id = m.old_id;

-- 4. 迁移复盘数据（需要字段映射）
INSERT INTO public.reviews_new (
  user_id, title, content, tags, emotion_score, lessons_learned, 
  review_date, created_at, updated_at
)
SELECT 
  user_id, title, content, tags, 
  performance_rating as emotion_score, -- 映射字段
  lessons_learned, review_date, created_at, updated_at
FROM public.reviews_old;

-- 5. 迁移资产数据
INSERT INTO public.assets_new (
  user_id, account_id, symbol, name, type, current_price, quantity,
  average_cost, market_value, profit_loss, profit_loss_percentage,
  last_updated, created_at, updated_at
)
SELECT 
  a.user_id, m.new_id, a.symbol, a.name, a.type, a.current_price, a.quantity,
  a.average_cost, a.total_value as market_value, a.profit_loss, a.profit_loss_percentage,
  a.last_updated, a.created_at, a.updated_at
FROM public.assets_old a
JOIN account_id_mapping m ON a.account_id = m.old_id;
```

## 🧪 测试验证步骤

### 1. **数据完整性测试**
```sql
-- 检查记录数量是否匹配
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'accounts', COUNT(*) FROM public.accounts
UNION ALL
SELECT 'transactions', COUNT(*) FROM public.transactions
UNION ALL
SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL
SELECT 'assets', COUNT(*) FROM public.assets;

-- 检查外键关系
SELECT COUNT(*) as orphaned_accounts 
FROM public.accounts a 
LEFT JOIN public.profiles p ON a.user_id = p.id 
WHERE p.id IS NULL;

SELECT COUNT(*) as orphaned_transactions 
FROM public.transactions t 
LEFT JOIN public.accounts a ON t.account_id = a.id 
WHERE a.id IS NULL;
```

### 2. **功能测试清单**

#### Profile页面测试
- [ ] 用户信息显示正确
- [ ] 新增字段（phone, location, bio）可以编辑和保存
- [ ] 头像上传功能正常
- [ ] 订阅信息显示正确

#### Accounts页面测试
- [ ] 账户列表显示正确
- [ ] 创建新账户功能正常
- [ ] 编辑账户信息功能正常
- [ ] 删除账户功能正常
- [ ] 账户余额计算正确

#### Transactions页面测试
- [ ] 交易记录列表显示正确
- [ ] 创建新交易功能正常
- [ ] 编辑交易记录功能正常
- [ ] 删除交易记录功能正常
- [ ] 新增交易类型（split, merge）可选择
- [ ] 交易统计数据正确

#### Reviews页面测试
- [ ] 复盘日志列表显示正确
- [ ] 创建新复盘功能正常
- [ ] 情绪评分功能正常
- [ ] 标签功能正常
- [ ] 关联交易功能正常
- [ ] 编辑复盘功能正常

#### Assets页面测试
- [ ] 资产列表显示正确
- [ ] 资产分析数据正确
- [ ] 风险指标显示正常
- [ ] 收益计算正确
- [ ] 图表显示正常

### 3. **性能测试**
```sql
-- 检查查询性能
EXPLAIN ANALYZE SELECT * FROM public.accounts WHERE user_id = 'test-uuid';
EXPLAIN ANALYZE SELECT * FROM public.transactions WHERE account_id = 1;
EXPLAIN ANALYZE SELECT * FROM public.assets WHERE user_id = 'test-uuid';
```

## 🔧 故障排除

### 常见问题和解决方案

1. **ID类型不匹配错误**
   - 确保前端代码使用正确的ID类型
   - 数字ID使用number类型，UUID使用string类型

2. **枚举值错误**
   - 检查transaction_type是否包含新增的split, merge
   - 检查mood_type枚举是否正确创建

3. **外键约束错误**
   - 确保account_id引用正确的数字ID
   - 检查user_id是否为有效的UUID

4. **权限问题**
   - 确保RLS策略正确应用
   - 检查用户是否有正确的访问权限

## 📈 后续优化建议

1. **添加更多索引**以提高查询性能
2. **实现数据分区**对于大量历史数据
3. **添加数据验证触发器**确保数据一致性
4. **实现软删除**保护重要数据
5. **添加审计日志**跟踪数据变更

## ✅ 验收标准

数据库重建成功的标准：
- [ ] 所有表创建成功，字段类型正确
- [ ] 所有索引和约束创建成功
- [ ] RLS策略正确应用
- [ ] 触发器正常工作
- [ ] 所有页面功能正常
- [ ] 数据保存和更新正常
- [ ] 性能满足要求
- [ ] 无数据丢失或损坏
