# AssetWise 数据库字段对齐分析报告

## 📊 页面功能与数据库字段对比分析

### 1. **Profile页面字段分析**

#### 页面使用的字段：
```typescript
// 用户基本信息
- id: string
- email: string  
- username: string
- full_name: string
- avatar_url: string

// 新增字段（当前schema缺失）
- phone: string          // ❌ 缺失
- location: string       // ❌ 缺失  
- bio: string           // ❌ 缺失

// 订阅信息
- subscription_type: 'free' | 'professional' | 'flagship'
- subscription_expires_at: string
- created_at: string
```

#### 当前Schema状态：
```sql
-- profiles表 - 缺少3个字段
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  -- phone TEXT,              // ❌ 缺失
  -- location TEXT,           // ❌ 缺失
  -- bio TEXT,                // ❌ 缺失
  subscription_type subscription_type NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 2. **Reviews页面字段分析**

#### 页面使用的字段：
```typescript
// 基本信息
- id: string
- user_id: string
- title: string
- content: string
- tags: string[]
- review_date: string

// 情绪分析字段（当前schema缺失）
- emotion_score: number      // ❌ 缺失 (1-10评分)
- mood: 'positive' | 'neutral' | 'negative'  // ❌ 缺失

// 关联数据（当前schema缺失）
- related_transactions: number[]  // ❌ 缺失

// 扩展字段（页面支持但schema缺失）
- lessons: string           // ❌ 缺失 (对应lessons_learned)
- next_plan: string         // ❌ 缺失
- profit: number            // ❌ 缺失
- profit_rate: number       // ❌ 缺失
```

#### 当前Schema状态：
```sql
-- reviews表 - 字段严重不匹配
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5), // ❌ 应为emotion_score
  lessons_learned TEXT,  // ✅ 但页面使用lessons
  review_date TIMESTAMPTZ NOT NULL,
  -- emotion_score INTEGER,           // ❌ 缺失
  -- mood TEXT,                       // ❌ 缺失
  -- related_transactions UUID[],     // ❌ 缺失
  -- next_plan TEXT,                  // ❌ 缺失
  -- profit DECIMAL(20, 8),           // ❌ 缺失
  -- profit_rate DECIMAL(10, 4),      // ❌ 缺失
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 3. **Accounts页面字段分析**

#### 页面使用的字段：
```typescript
- id: number
- user_id: string
- name: string
- type: 'stock' | 'fund' | 'cash' | 'crypto'
- broker: string
- account_number: string
- currency: string
- balance: number
- description: string  // 当前schema支持
- created_at: string
```

#### 当前Schema状态：
```sql
-- accounts表 - 基本匹配，需要调整类型
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  // ❌ 页面期望number
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type account_type NOT NULL,  // ✅ 但枚举值需要调整
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

### 4. **Transactions页面字段分析**

#### 页面使用的字段：
```typescript
- id: number
- user_id: string
- account_id: string | number
- symbol: string
- name: string
- type: 'buy' | 'sell' | 'dividend' | 'split' | 'merge'
- quantity: number
- price: number
- amount: number  // 计算字段：quantity * price
- fee: number
- tax: number
- transaction_date: string
- notes: string
```

#### 当前Schema状态：
```sql
-- transactions表 - 基本匹配，需要调整类型
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  // ❌ 页面期望number
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES public.accounts,     // ❌ 类型不匹配
  type transaction_type NOT NULL,  // ✅ 但需要添加split, merge
  symbol TEXT,
  name TEXT,
  quantity DECIMAL(20, 8),
  price DECIMAL(20, 8),
  amount DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) DEFAULT 0,
  tax DECIMAL(20, 8) DEFAULT 0,
  notes TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 5. **Assets页面字段分析**

#### 页面使用的字段：
```typescript
// 基本资产信息
- id: string
- user_id: string
- account_id: number
- symbol: string
- name: string
- type: string
- quantity: number
- current_price: number
- market_value: number
- average_cost: number

// 收益分析字段
- profit: number
- profit_rate: number
- day_change: number
- day_change_rate: number
- weight: number  // 在投资组合中的权重

// 风险分析字段（当前schema缺失）
- volatility: number         // ❌ 缺失
- beta: number              // ❌ 缺失
- sharpe_ratio: number      // ❌ 缺失
- max_drawdown: number      // ❌ 缺失
```

#### 当前Schema状态：
```sql
-- assets表 - 缺少风险分析字段
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES public.accounts,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  type asset_type NOT NULL,
  current_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity >= 0),
  average_cost DECIMAL(20, 8) NOT NULL CHECK (average_cost >= 0),
  total_value DECIMAL(20, 8) NOT NULL,  // ✅ 对应market_value
  profit_loss DECIMAL(20, 8) NOT NULL, // ✅ 对应profit
  profit_loss_percentage DECIMAL(10, 4) NOT NULL, // ✅ 对应profit_rate
  -- day_change DECIMAL(20, 8),           // ❌ 缺失
  -- day_change_rate DECIMAL(10, 4),      // ❌ 缺失
  -- weight DECIMAL(10, 4),               // ❌ 缺失
  -- volatility DECIMAL(10, 4),           // ❌ 缺失
  -- beta DECIMAL(10, 4),                 // ❌ 缺失
  -- sharpe_ratio DECIMAL(10, 4),         // ❌ 缺失
  -- max_drawdown DECIMAL(10, 4),         // ❌ 缺失
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## 🔍 关键问题总结

### 1. **ID类型不一致**
- **问题**：页面期望数字ID，数据库使用UUID
- **影响**：Accounts、Transactions页面的ID处理
- **解决方案**：统一使用数字ID或调整前端处理

### 2. **Reviews表字段严重不匹配**
- **问题**：情绪分析字段完全缺失
- **影响**：复盘功能无法正常工作
- **解决方案**：重新设计reviews表结构

### 3. **Profile表缺少用户扩展信息**
- **问题**：phone, location, bio字段缺失
- **影响**：用户资料编辑功能不完整
- **解决方案**：添加缺失字段

### 4. **Assets表缺少风险分析字段**
- **问题**：高级分析功能所需字段缺失
- **影响**：资产分析功能受限
- **解决方案**：添加风险分析相关字段

### 5. **枚举类型需要调整**
- **问题**：transaction_type缺少split, merge
- **影响**：交易类型选择受限
- **解决方案**：更新枚举定义

## 📋 下一步行动计划

1. **设计新的完整Schema** - 解决所有字段不匹配问题
2. **生成SQL重建脚本** - 包含DROP和CREATE语句
3. **更新TypeScript类型定义** - 确保类型安全
4. **验证页面功能** - 确保所有功能正常工作
5. **数据迁移策略** - 保护现有数据

## 🎯 预期效果

修复后将实现：
- ✅ Profile页面完整的用户信息编辑
- ✅ Reviews页面完整的情绪分析功能  
- ✅ Assets页面完整的风险分析功能
- ✅ 所有页面的数据保存和更新功能
- ✅ 类型安全的数据操作
