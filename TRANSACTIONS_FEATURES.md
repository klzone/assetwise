# 交易记录功能说明

## 功能概述

AssetWise 交易记录模块提供了完整的投资交易管理功能，支持多种交易类型、实时统计分析、高级搜索过滤等功能。

## 主要功能

### 1. 交易记录管理

#### 支持的交易类型
- **买入 (buy)** - 购买证券
- **卖出 (sell)** - 出售证券  
- **分红 (dividend)** - 股息收入
- **存入 (deposit)** - 资金存入
- **取出 (withdraw)** - 资金取出
- **拆股 (split)** - 股票拆分
- **合股 (merge)** - 股票合并
- **送股 (bonus)** - 送股
- **配股 (rights)** - 配股

#### 交易信息字段
- 证券代码和名称
- 交易类型
- 数量和价格
- 交易金额（自动计算）
- 手续费和税费
- 货币类型（CNY, USD, HKD, EUR）
- 交易所信息
- 交易日期
- 备注信息

### 2. 高级搜索和过滤

#### 搜索功能
- 按证券代码搜索
- 按证券名称搜索
- 模糊匹配支持

#### 过滤选项
- **交易类型过滤** - 按买入、卖出等类型筛选
- **账户过滤** - 按投资账户筛选
- **日期范围过滤** - 按交易日期范围筛选
- **组合过滤** - 支持多条件组合筛选

### 3. 统计分析

#### 基础统计
- 总交易数量
- 买入总额
- 卖出总额
- 总手续费和税费
- 净盈亏计算

#### 高级统计
- 按交易类型统计
- 按证券代码统计
- 月度交易统计
- 盈亏趋势分析

### 4. 分页和排序

- 支持分页显示，默认每页10条记录
- 按交易日期倒序排列
- 页面导航控件
- 记录数量显示

### 5. 数据导入导出

#### 导出功能
- JSON格式导出
- 包含交易记录和统计数据
- 支持过滤条件导出
- 现代浏览器文件保存API支持

#### 导入功能（计划中）
- JSON格式导入
- 数据验证和去重
- 批量导入支持

## 技术实现

### 数据库设计

基于 Supabase PostgreSQL 数据库，使用以下表结构：

```sql
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE,
  type transaction_type NOT NULL,
  symbol TEXT,
  name TEXT,
  quantity DECIMAL(20, 8),
  price DECIMAL(20, 8),
  amount DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) DEFAULT 0,
  tax DECIMAL(20, 8) DEFAULT 0,
  currency TEXT DEFAULT 'CNY',
  exchange TEXT,
  notes TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### API 服务

#### SupabaseDataService 方法

1. **getTransactions(userId)** - 获取用户所有交易记录
2. **getTransactionsWithPagination(userId, page, limit, filters)** - 分页获取交易记录
3. **createTransaction(transaction)** - 创建新交易记录
4. **updateTransaction(id, transaction)** - 更新交易记录
5. **deleteTransaction(id)** - 删除交易记录
6. **getTransactionStats(userId)** - 获取交易统计数据

#### 过滤参数支持

```typescript
interface TransactionFilters {
  symbol?: string;        // 证券代码模糊搜索
  type?: string;          // 交易类型
  account_id?: string;    // 账户ID
  date_from?: string;     // 开始日期
  date_to?: string;       // 结束日期
}
```

### 前端组件

#### 主要组件
- **TransactionsPage** - 主页面组件
- **TransactionDialog** - 添加/编辑交易对话框
- **TransactionTable** - 交易记录表格
- **TransactionStats** - 统计卡片
- **TransactionFilters** - 搜索过滤组件

#### 状态管理
- React Hooks 状态管理
- 实时数据更新
- 错误处理和加载状态

## 使用指南

### 添加交易记录

1. 点击"添加交易"按钮
2. 选择投资账户
3. 选择交易类型
4. 填写证券信息（代码、名称）
5. 输入数量和价格
6. 填写费用信息（可选）
7. 选择交易日期
8. 添加备注（可选）
9. 点击"添加交易"保存

### 搜索和过滤

1. 在搜索框输入证券代码或名称
2. 选择交易类型过滤
3. 选择账户过滤
4. 设置日期范围
5. 系统自动应用过滤条件

### 查看统计

1. 点击"显示统计"按钮
2. 查看统计卡片信息
3. 分析交易数据和盈亏情况

### 编辑交易

1. 在交易列表中点击编辑按钮
2. 修改交易信息
3. 点击"保存修改"

### 删除交易

1. 在交易列表中点击删除按钮
2. 确认删除操作

## 权限和安全

- 基于 Supabase RLS（行级安全）
- 用户只能访问自己的交易记录
- 所有操作需要用户认证
- 数据传输加密

## 性能优化

- 分页加载减少数据传输
- 索引优化查询性能
- 前端缓存减少重复请求
- 懒加载统计数据

## 测试

运行测试脚本验证功能：

```bash
node test-transactions.js
```

## 未来计划

1. **批量操作** - 支持批量导入、编辑、删除
2. **高级图表** - 交易趋势图表、盈亏分析图
3. **自动分类** - 基于规则的交易自动分类
4. **提醒功能** - 交易提醒和风险警告
5. **报表生成** - PDF/Excel 格式报表导出
6. **API集成** - 券商API自动同步交易数据

## 技术栈

- **前端**: React, TypeScript, Tailwind CSS, shadcn/ui
- **后端**: Supabase (PostgreSQL + Auth + RLS)
- **状态管理**: React Hooks
- **UI组件**: shadcn/ui 组件库
- **图标**: Lucide React
- **类型安全**: TypeScript 严格模式
