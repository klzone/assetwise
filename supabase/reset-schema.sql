-- =====================================================
-- AssetWise Supabase 数据库重置脚本
-- 删除旧表并创建与本地数据格式一致的新表结构
-- =====================================================

-- 1. 删除现有表和类型（如果存在）
DROP TABLE IF EXISTS public.investment_plans CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 删除现有枚举类型
DROP TYPE IF EXISTS subscription_type CASCADE;
DROP TYPE IF EXISTS asset_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS plan_status CASCADE;
DROP TYPE IF EXISTS risk_level CASCADE;
DROP TYPE IF EXISTS account_type CASCADE;

-- 2. 创建枚举类型
CREATE TYPE subscription_type AS ENUM ('free', 'professional', 'flagship');

CREATE TYPE asset_type AS ENUM (
  'stock', 'crypto', 'forex', 'commodity', 'bond', 'fund', 
  'real_estate', 'option', 'futures'
);

CREATE TYPE transaction_type AS ENUM (
  'buy', 'sell', 'dividend', 'deposit', 'withdraw', 
  'split', 'merge', 'bonus', 'rights'
);

CREATE TYPE plan_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

-- 支持所有账户类型
CREATE TYPE account_type AS ENUM (
  'securities', 'stock', 'fund', 'cash', 'crypto', 'bank',
  'futures', 'forex', 'commodity', 'insurance', 'pension',
  'education', 'real_estate', 'p2p', 'bond', 'option'
);

-- 3. 创建用户档案表
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  subscription_type subscription_type NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 4. 创建投资账户表
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  broker TEXT,
  account_number TEXT,
  currency TEXT DEFAULT 'CNY',
  balance DECIMAL(20, 8) DEFAULT 0,
  initial_balance DECIMAL(20, 8) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  risk_level risk_level DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. 创建交易记录表
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

-- 6. 创建复盘日志表
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  market_condition TEXT,
  lessons_learned TEXT,
  action_items TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. 创建资产表
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  type asset_type NOT NULL,
  exchange TEXT,
  currency TEXT DEFAULT 'CNY',
  current_price DECIMAL(20, 8),
  market_cap DECIMAL(20, 2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, symbol, exchange)
);

-- 8. 创建投资计划表
CREATE TABLE public.investment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(20, 8),
  current_amount DECIMAL(20, 8) DEFAULT 0,
  target_date DATE,
  status plan_status DEFAULT 'active',
  risk_level risk_level DEFAULT 'medium',
  asset_allocation JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. 启用行级安全策略 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

-- 10. 创建RLS策略

-- 用户档案策略
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- 投资账户策略
CREATE POLICY "Users can view their own accounts" ON public.accounts
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own accounts" ON public.accounts
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own accounts" ON public.accounts
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own accounts" ON public.accounts
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 交易记录策略
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 复盘日志策略
CREATE POLICY "Users can view their own reviews" ON public.reviews
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own reviews" ON public.reviews
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 资产策略
CREATE POLICY "Users can view their own assets" ON public.assets
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own assets" ON public.assets
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own assets" ON public.assets
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own assets" ON public.assets
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 投资计划策略
CREATE POLICY "Users can view their own investment plans" ON public.investment_plans
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own investment plans" ON public.investment_plans
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own investment plans" ON public.investment_plans
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own investment plans" ON public.investment_plans
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 11. 创建触发器函数来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. 为所有表创建 updated_at 触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_plans_updated_at BEFORE UPDATE ON public.investment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. 创建索引以提高查询性能
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_symbol ON public.transactions(symbol);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_symbol ON public.assets(symbol);
CREATE INDEX idx_investment_plans_user_id ON public.investment_plans(user_id);

-- 14. 验证创建结果
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'accounts', 'transactions', 'reviews', 'assets', 'investment_plans')
ORDER BY tablename;

-- 显示枚举类型
SELECT
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('subscription_type', 'asset_type', 'transaction_type', 'plan_status', 'risk_level', 'account_type')
GROUP BY t.typname
ORDER BY t.typname;

-- 完成提示
SELECT '✅ AssetWise 数据库重置完成！所有表已创建并配置了RLS策略。' as status;
