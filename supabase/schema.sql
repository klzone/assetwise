-- 创建枚举类型
CREATE TYPE subscription_type AS ENUM ('free', 'professional', 'flagship');
CREATE TYPE asset_type AS ENUM ('stock', 'crypto', 'forex', 'commodity', 'bond', 'fund');
CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'dividend', 'deposit', 'withdraw');
CREATE TYPE plan_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE account_type AS ENUM ('securities', 'stock', 'fund', 'cash', 'crypto', 'bank', 'futures', 'forex', 'commodity', 'insurance', 'pension', 'education', 'real_estate', 'p2p', 'bond', 'option');

-- 创建用户档案表
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_type subscription_type NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 创建投资账户表
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

-- 创建交易记录表
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES public.accounts,
  type transaction_type NOT NULL,
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

-- 创建复盘日志表
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  lessons_learned TEXT,
  review_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建资产表
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
  total_value DECIMAL(20, 8) NOT NULL,
  profit_loss DECIMAL(20, 8) NOT NULL,
  profit_loss_percentage DECIMAL(10, 4) NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, account_id, symbol)
);

-- 创建投资计划表
CREATE TABLE public.investment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(20, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(20, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE NOT NULL,
  status plan_status NOT NULL DEFAULT 'active',
  risk_level risk_level NOT NULL,
  category asset_type NOT NULL,
  expected_return DECIMAL(10, 4) NOT NULL DEFAULT 0,
  actual_return DECIMAL(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 启用行级安全策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

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

-- 创建触发器函数来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
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

-- 创建自动创建用户档案的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_type)
  VALUES (NEW.id, NEW.email, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器，当新用户注册时自动创建档案
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建函数来自动创建用户档案
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_type)
  VALUES (NEW.id, NEW.email, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器，当新用户注册时自动创建档案
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
