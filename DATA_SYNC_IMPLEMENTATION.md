# AssetWise 数据存储和同步功能实现总结

## 📊 项目概述

AssetWise 是一个投资管理应用，支持本地存储和云端同步的双重架构。本文档总结了数据存储和同步功能的完整实现。

## 🏗️ 数据存储架构

### 1. 本地存储 (localStorage)
- **用途**: 免费版本的主要存储方式，确保离线可用
- **数据类型**: 用户、账户、交易记录、复盘日志、投资计划
- **特点**: 快速访问、离线可用、数据加密

### 2. 云端存储 (Supabase)
- **用途**: 付费版本的云端同步和备份
- **数据库**: PostgreSQL with Row Level Security
- **表结构**: profiles, accounts, transactions, reviews, assets, investment_plans
- **特点**: 多设备同步、数据备份、实时更新

## 🔧 核心功能实现

### 1. 数据库表结构优化

#### 新增 accounts 表
```sql
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  broker TEXT,
  account_number TEXT,
  currency TEXT DEFAULT 'CNY',
  balance DECIMAL(20, 8) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### 扩展枚举类型
- `account_type`: securities, fund, cash, crypto, bank
- `transaction_type`: buy, sell, dividend, deposit, withdraw

### 2. 双向数据同步服务

#### 本地到云端同步
- 自动检测本地数据变更
- 维护同步队列
- 批量上传到云端
- 错误重试机制

#### 云端到本地同步
- 定期拉取云端数据
- 智能数据合并
- 冲突自动解决
- 增量更新

### 3. 数据冲突解决机制

#### 冲突检测
- 比较本地和云端数据的更新时间
- 检查数据内容差异
- 识别需要解决的冲突项

#### 自动解决策略
- **时间优先**: 使用最新更新的数据
- **智能合并**: 合并不冲突的字段
- **类型特定**: 根据数据类型采用不同策略

## 📁 文件结构

```
src/lib/services/
├── local-data-manager.service.ts      # 本地数据管理
├── cloud-sync.service.ts              # 云端同步服务
├── data-conflict-resolver.service.ts  # 冲突解决服务
├── supabase-data.service.ts           # Supabase数据操作
└── __tests__/
    └── data-sync.test.ts              # 同步功能测试

src/lib/types/
├── database.types.ts                  # Supabase类型定义
└── data.types.ts                      # 本地数据类型

src/app/sync-test/
└── page.tsx                          # 同步功能测试页面

supabase/
└── schema.sql                        # 数据库架构定义
```

## 🚀 使用方法

### 1. 访问测试页面
```
http://localhost:3000/sync-test
```

### 2. 测试功能
- **创建测试数据**: 点击"创建测试账户"和"创建测试交易"
- **手动同步**: 点击"手动同步"将本地数据推送到云端
- **拉取云端数据**: 点击"拉取云端数据"从云端获取最新数据
- **监控状态**: 查看同步状态、待同步项目数量等

### 3. 开发环境设置
```bash
# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 构建项目
pnpm build
```

## 🔍 技术特性

### 1. 离线优先
- 所有操作首先保存到本地
- 确保应用在离线状态下正常工作
- 网络恢复后自动同步

### 2. 数据一致性
- 通过冲突解决机制保证数据一致性
- 支持多设备同时操作
- 智能合并策略

### 3. 性能优化
- 批量操作减少网络请求
- 增量同步只传输变更数据
- 本地缓存提高响应速度

### 4. 错误处理
- 完善的错误处理和重试机制
- 用户友好的错误提示
- 同步状态实时反馈

## 📊 数据流程图

```
用户操作 → 本地存储 → 同步队列 → 云端同步 → 冲突解决 → 数据合并
    ↓           ↓           ↓           ↓           ↓           ↓
  即时响应   离线可用   批量处理   网络传输   智能处理   最终一致
```

## 🎯 版本功能对比

| 功能 | 免费版 | 专业版 | 旗舰版 |
|------|--------|--------|--------|
| 投资账户 | 9个 | 无限制 | 无限制 |
| 交易记录 | 1000条 | 无限制 | 无限制 |
| 本地存储 | ✅ | ✅ | ✅ |
| 云端同步 | ❌ | ✅ | ✅ |
| 多设备访问 | ❌ | ✅ | ✅ |
| AI分析 | ❌ | ❌ | ✅ |
| PDF报告 | ❌ | ❌ | ✅ |

## 🔧 配置说明

### 环境变量
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ENCRYPTION_KEY=your_encryption_key
```

### Supabase 配置
1. 创建新项目
2. 运行 `supabase/schema.sql` 创建表结构
3. 配置 Row Level Security 策略
4. 设置环境变量

## 📈 未来优化方向

1. **实时同步**: 使用 WebSocket 实现实时数据同步
2. **离线队列**: 改进离线操作队列管理
3. **数据压缩**: 优化网络传输效率
4. **版本控制**: 实现数据版本历史管理
5. **性能监控**: 添加同步性能监控和分析

## 🎉 总结

AssetWise 的数据存储和同步功能现已完全实现，支持：
- ✅ 完整的本地数据管理
- ✅ 可靠的云端同步机制
- ✅ 智能的冲突解决策略
- ✅ 全面的错误处理
- ✅ 实时的状态监控

用户可以安心使用本地功能，付费用户还可以享受云端同步带来的便利和安全保障。
