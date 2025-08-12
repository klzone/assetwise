-- AssetWise 数据库结构优化迁移
-- 版本: 1.0.0
-- 创建时间: 2024-01-01

-- =============================================
-- 1. 用户表优化
-- =============================================

-- 添加用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON auth.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_sign_in ON auth.users(last_sign_in_at);

-- 创建用户配置表
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    language VARCHAR(10) DEFAULT 'zh-CN',
    currency VARCHAR(10) DEFAULT 'CNY',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_profile UNIQUE(user_id)
);

-- 用户配置表索引
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username) WHERE username IS NOT NULL;
CREATE INDEX idx_user_profiles_updated_at ON public.user_profiles(updated_at);

-- =============================================
-- 2. 账户表优化
-- =============================================

-- 重新创建优化的账户表
DROP TABLE IF EXISTS public.accounts CASCADE;
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('checking', 'savings', 'investment', 'credit', 'loan', 'other')),
    institution VARCHAR(100),
    account_number VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'CNY',
    balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2),
    credit_limit DECIMAL(15,2),
    interest_rate DECIMAL(5,4),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_balance CHECK (balance >= 0 OR type = 'credit'),
    CONSTRAINT valid_currency CHECK (currency ~ '^[A-Z]{3}$')
);

-- 账户表索引
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);
CREATE INDEX idx_accounts_currency ON public.accounts(currency);
CREATE INDEX idx_accounts_is_active ON public.accounts(is_active) WHERE is_active = true;
CREATE INDEX idx_accounts_is_primary ON public.accounts(is_primary) WHERE is_primary = true;
CREATE INDEX idx_accounts_updated_at ON public.accounts(updated_at);
CREATE INDEX idx_accounts_balance ON public.accounts(balance) WHERE balance > 0;

-- =============================================
-- 3. 资产表优化
-- =============================================

-- 重新创建优化的资产表
DROP TABLE IF EXISTS public.assets CASCADE;
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('stock', 'fund', 'bond', 'crypto', 'forex', 'commodity', 'cash', 'real_estate', 'other')),
    exchange VARCHAR(20),
    sector VARCHAR(50),
    industry VARCHAR(100),
    country VARCHAR(10) DEFAULT 'CN',
    currency VARCHAR(10) DEFAULT 'CNY',
    
    -- 持仓信息
    quantity DECIMAL(18,8) DEFAULT 0,
    average_cost DECIMAL(15,4) DEFAULT 0,
    current_price DECIMAL(15,4) DEFAULT 0,
    market_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * current_price) STORED,
    profit_loss DECIMAL(15,2) GENERATED ALWAYS AS (market_value - (quantity * average_cost)) STORED,
    profit_loss_percentage DECIMAL(8,4) GENERATED ALWAYS AS (
        CASE 
            WHEN quantity * average_cost > 0 
            THEN ((market_value - (quantity * average_cost)) / (quantity * average_cost)) * 100
            ELSE 0 
        END
    ) STORED,
    
    -- 市场数据
    day_change DECIMAL(15,4) DEFAULT 0,
    day_change_percentage DECIMAL(8,4) DEFAULT 0,
    week_52_high DECIMAL(15,4),
    week_52_low DECIMAL(15,4),
    market_cap BIGINT,
    volume BIGINT DEFAULT 0,
    pe_ratio DECIMAL(8,2),
    dividend_yield DECIMAL(5,4),
    
    -- 用户数据
    is_favorite BOOLEAN DEFAULT false,
    is_watchlist BOOLEAN DEFAULT false,
    user_notes TEXT,
    tags TEXT[],
    alert_price_high DECIMAL(15,4),
    alert_price_low DECIMAL(15,4),
    
    -- 系统字段
    last_price_update TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_quantity CHECK (quantity >= 0),
    CONSTRAINT positive_price CHECK (current_price >= 0),
    CONSTRAINT valid_symbol CHECK (symbol ~ '^[A-Z0-9._-]+$'),
    CONSTRAINT valid_currency CHECK (currency ~ '^[A-Z]{3}$')
);

-- 资产表索引
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_account_id ON public.assets(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_assets_symbol ON public.assets(symbol);
CREATE INDEX idx_assets_type ON public.assets(type);
CREATE INDEX idx_assets_exchange ON public.assets(exchange) WHERE exchange IS NOT NULL;
CREATE INDEX idx_assets_sector ON public.assets(sector) WHERE sector IS NOT NULL;
CREATE INDEX idx_assets_currency ON public.assets(currency);
CREATE INDEX idx_assets_market_value ON public.assets(market_value) WHERE market_value > 0;
CREATE INDEX idx_assets_profit_loss ON public.assets(profit_loss);
CREATE INDEX idx_assets_is_favorite ON public.assets(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_assets_is_watchlist ON public.assets(is_watchlist) WHERE is_watchlist = true;
CREATE INDEX idx_assets_updated_at ON public.assets(updated_at);
CREATE INDEX idx_assets_last_price_update ON public.assets(last_price_update);

-- 复合索引
CREATE INDEX idx_assets_user_type ON public.assets(user_id, type);
CREATE INDEX idx_assets_user_symbol ON public.assets(user_id, symbol);
CREATE INDEX idx_assets_symbol_exchange ON public.assets(symbol, exchange);

-- GIN索引用于数组和JSONB
CREATE INDEX idx_assets_tags ON public.assets USING GIN(tags);
CREATE INDEX idx_assets_metadata ON public.assets USING GIN(metadata);

-- =============================================
-- 4. 交易记录表优化
-- =============================================

-- 重新创建优化的交易表
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    
    -- 交易基本信息
    type VARCHAR(20) NOT NULL CHECK (type IN ('buy', 'sell', 'dividend', 'deposit', 'withdraw', 'transfer_in', 'transfer_out', 'split', 'bonus', 'rights', 'merge')),
    symbol VARCHAR(20),
    name VARCHAR(200),
    
    -- 交易数量和价格
    quantity DECIMAL(18,8) DEFAULT 0,
    price DECIMAL(15,4) DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0,
    tax DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS (
        CASE 
            WHEN type IN ('buy', 'withdraw', 'transfer_out') THEN -(amount + fee + tax)
            ELSE (amount - fee - tax)
        END
    ) STORED,
    
    -- 交易时间和状态
    transaction_date TIMESTAMPTZ NOT NULL,
    settlement_date TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    
    -- 外汇信息
    currency VARCHAR(10) DEFAULT 'CNY',
    exchange_rate DECIMAL(12,6) DEFAULT 1.0,
    base_currency VARCHAR(10) DEFAULT 'CNY',
    
    -- 附加信息
    order_id VARCHAR(50),
    reference_id VARCHAR(50),
    notes TEXT,
    tags TEXT[],
    
    -- 系统字段
    imported_from VARCHAR(50),
    last_sync_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_amount CHECK (amount >= 0),
    CONSTRAINT positive_fee CHECK (fee >= 0),
    CONSTRAINT positive_tax CHECK (tax >= 0),
    CONSTRAINT valid_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT valid_exchange_rate CHECK (exchange_rate > 0)
);

-- 交易表索引
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_transactions_asset_id ON public.transactions(asset_id) WHERE asset_id IS NOT NULL;
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_symbol ON public.transactions(symbol) WHERE symbol IS NOT NULL;
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_currency ON public.transactions(currency);
CREATE INDEX idx_transactions_transaction_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_settlement_date ON public.transactions(settlement_date) WHERE settlement_date IS NOT NULL;
CREATE INDEX idx_transactions_amount ON public.transactions(amount);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_transactions_updated_at ON public.transactions(updated_at);

-- 复合索引
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX idx_transactions_user_symbol ON public.transactions(user_id, symbol) WHERE symbol IS NOT NULL;
CREATE INDEX idx_transactions_symbol_date ON public.transactions(symbol, transaction_date DESC) WHERE symbol IS NOT NULL;
CREATE INDEX idx_transactions_account_date ON public.transactions(account_id, transaction_date DESC) WHERE account_id IS NOT NULL;

-- GIN索引
CREATE INDEX idx_transactions_tags ON public.transactions USING GIN(tags);
CREATE INDEX idx_transactions_metadata ON public.transactions USING GIN(metadata);

-- =============================================
-- 5. 投资组合表
-- =============================================

-- 创建投资组合表
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 投资策略
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('conservative', 'moderate', 'aggressive')),
    investment_goal TEXT NOT NULL,
    time_horizon INTEGER NOT NULL CHECK (time_horizon > 0 AND time_horizon <= 50),
    
    -- 资产配置
    target_allocation JSONB NOT NULL DEFAULT '[]',
    current_allocation JSONB NOT NULL DEFAULT '[]',
    
    -- 价值信息
    total_value DECIMAL(15,2) DEFAULT 0,
    target_value DECIMAL(15,2) DEFAULT 0,
    cash_balance DECIMAL(15,2) DEFAULT 0,
    
    -- 性能指标
    total_return DECIMAL(15,2) DEFAULT 0,
    total_return_percentage DECIMAL(8,4) DEFAULT 0,
    annualized_return DECIMAL(8,4) DEFAULT 0,
    volatility DECIMAL(8,4) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    max_drawdown DECIMAL(8,4) DEFAULT 0,
    
    -- 重新平衡设置
    rebalance_threshold DECIMAL(5,2) DEFAULT 5.0 CHECK (rebalance_threshold > 0 AND rebalance_threshold <= 50),
    last_rebalance_date TIMESTAMPTZ,
    auto_rebalance BOOLEAN DEFAULT false,
    
    -- 状态
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- 系统字段
    last_sync_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_portfolio_name UNIQUE(user_id, name) WHERE is_active = true
);

-- 投资组合表索引
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_portfolios_risk_level ON public.portfolios(risk_level);
CREATE INDEX idx_portfolios_is_active ON public.portfolios(is_active) WHERE is_active = true;
CREATE INDEX idx_portfolios_is_public ON public.portfolios(is_public) WHERE is_public = true;
CREATE INDEX idx_portfolios_total_value ON public.portfolios(total_value) WHERE total_value > 0;
CREATE INDEX idx_portfolios_updated_at ON public.portfolios(updated_at);
CREATE INDEX idx_portfolios_last_rebalance ON public.portfolios(last_rebalance_date) WHERE last_rebalance_date IS NOT NULL;

-- 复合索引
CREATE INDEX idx_portfolios_user_active ON public.portfolios(user_id, is_active) WHERE is_active = true;

-- GIN索引
CREATE INDEX idx_portfolios_target_allocation ON public.portfolios USING GIN(target_allocation);
CREATE INDEX idx_portfolios_current_allocation ON public.portfolios USING GIN(current_allocation);
CREATE INDEX idx_portfolios_metadata ON public.portfolios USING GIN(metadata);

-- =============================================
-- 6. 投资组合资产表
-- =============================================

-- 创建投资组合资产表
CREATE TABLE IF NOT EXISTS public.portfolio_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    
    -- 基本信息
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(20) NOT NULL,
    
    -- 持仓信息
    quantity DECIMAL(18,8) NOT NULL DEFAULT 0,
    average_price DECIMAL(15,4) NOT NULL DEFAULT 0,
    current_price DECIMAL(15,4) NOT NULL DEFAULT 0,
    current_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * current_price) STORED,
    
    -- 配置信息
    target_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (target_percentage >= 0 AND target_percentage <= 100),
    current_percentage DECIMAL(5,2) DEFAULT 0,
    deviation DECIMAL(5,2) GENERATED ALWAYS AS (current_percentage - target_percentage) STORED,
    
    -- 性能指标
    cost_basis DECIMAL(15,2) GENERATED ALWAYS AS (quantity * average_price) STORED,
    unrealized_gain_loss DECIMAL(15,2) GENERATED ALWAYS AS (current_value - (quantity * average_price)) STORED,
    unrealized_gain_loss_percentage DECIMAL(8,4) GENERATED ALWAYS AS (
        CASE 
            WHEN quantity * average_price > 0 
            THEN ((current_value - (quantity * average_price)) / (quantity * average_price)) * 100
            ELSE 0 
        END
    ) STORED,
    
    -- 系统字段
    last_price_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_portfolio_asset UNIQUE(portfolio_id, asset_id),
    CONSTRAINT positive_quantity CHECK (quantity >= 0),
    CONSTRAINT positive_price CHECK (current_price >= 0)
);

-- 投资组合资产表索引
CREATE INDEX idx_portfolio_assets_portfolio_id ON public.portfolio_assets(portfolio_id);
CREATE INDEX idx_portfolio_assets_asset_id ON public.portfolio_assets(asset_id);
CREATE INDEX idx_portfolio_assets_symbol ON public.portfolio_assets(symbol);
CREATE INDEX idx_portfolio_assets_asset_type ON public.portfolio_assets(asset_type);
CREATE INDEX idx_portfolio_assets_current_value ON public.portfolio_assets(current_value) WHERE current_value > 0;
CREATE INDEX idx_portfolio_assets_target_percentage ON public.portfolio_assets(target_percentage);
CREATE INDEX idx_portfolio_assets_deviation ON public.portfolio_assets(deviation);
CREATE INDEX idx_portfolio_assets_updated_at ON public.portfolio_assets(updated_at);

-- 复合索引
CREATE INDEX idx_portfolio_assets_portfolio_type ON public.portfolio_assets(portfolio_id, asset_type);

-- =============================================
-- 7. 同步相关表
-- =============================================

-- 创建同步检查点表
CREATE TABLE IF NOT EXISTS public.sync_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name VARCHAR(50) NOT NULL,
    last_sync_timestamp TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01T00:00:00Z',
    last_sync_id VARCHAR(100),
    total_records INTEGER DEFAULT 0,
    synced_records INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_table_checkpoint UNIQUE(user_id, table_name)
);

-- 同步检查点表索引
CREATE INDEX idx_sync_checkpoints_user_id ON public.sync_checkpoints(user_id);
CREATE INDEX idx_sync_checkpoints_table_name ON public.sync_checkpoints(table_name);
CREATE INDEX idx_sync_checkpoints_last_sync ON public.sync_checkpoints(last_sync_timestamp);

-- 创建手动冲突表
CREATE TABLE IF NOT EXISTS public.manual_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    client_value JSONB,
    server_value JSONB,
    client_timestamp TIMESTAMPTZ,
    server_timestamp TIMESTAMPTZ,
    conflict_type VARCHAR(20) NOT NULL CHECK (conflict_type IN ('value_mismatch', 'concurrent_edit', 'delete_conflict')),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_type VARCHAR(20) CHECK (resolution_type IN ('client', 'server', 'custom')),
    resolved_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 手动冲突表索引
CREATE INDEX idx_manual_conflicts_user_id ON public.manual_conflicts(user_id);
CREATE INDEX idx_manual_conflicts_table_name ON public.manual_conflicts(table_name);
CREATE INDEX idx_manual_conflicts_record_id ON public.manual_conflicts(record_id);
CREATE INDEX idx_manual_conflicts_resolved ON public.manual_conflicts(resolved);
CREATE INDEX idx_manual_conflicts_conflict_type ON public.manual_conflicts(conflict_type);
CREATE INDEX idx_manual_conflicts_created_at ON public.manual_conflicts(created_at);

-- 复合索引
CREATE INDEX idx_manual_conflicts_user_resolved ON public.manual_conflicts(user_id, resolved) WHERE resolved = false;

-- =============================================
-- 8. 触发器和函数
-- =============================================

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间戳触发器
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_assets_updated_at BEFORE UPDATE ON public.portfolio_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_checkpoints_updated_at BEFORE UPDATE ON public.sync_checkpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manual_conflicts_updated_at BEFORE UPDATE ON public.manual_conflicts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建投资组合资产更新函数
CREATE OR REPLACE FUNCTION update_portfolio_allocations()
RETURNS TRIGGER AS $$
DECLARE
    portfolio_total DECIMAL(15,2);
BEGIN
    -- 计算投资组合总价值
    SELECT COALESCE(SUM(current_value), 0) INTO portfolio_total
    FROM public.portfolio_assets 
    WHERE portfolio_id = COALESCE(NEW.portfolio_id, OLD.portfolio_id);
    
    -- 更新所有资产的当前百分比
    UPDATE public.portfolio_assets 
    SET current_percentage = CASE 
        WHEN portfolio_total > 0 THEN (current_value / portfolio_total) * 100 
        ELSE 0 
    END
    WHERE portfolio_id = COALESCE(NEW.portfolio_id, OLD.portfolio_id);
    
    -- 更新投资组合总价值
    UPDATE public.portfolios 
    SET total_value = portfolio_total,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.portfolio_id, OLD.portfolio_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 为投资组合资产表添加触发器
CREATE TRIGGER update_portfolio_allocations_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON public.portfolio_assets 
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_allocations();

-- =============================================
-- 9. 行级安全策略 (RLS)
-- =============================================

-- 启用RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_conflicts ENABLE ROW LEVEL SECURITY;

-- 用户配置表策略
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- 账户表策略
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- 资产表策略
CREATE POLICY "Users can view own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- 交易表策略
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- 投资组合表策略
CREATE POLICY "Users can view own portfolios" ON public.portfolios FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own portfolios" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolios" ON public.portfolios FOR DELETE USING (auth.uid() = user_id);

-- 投资组合资产表策略
CREATE POLICY "Users can view portfolio assets" ON public.portfolio_assets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.portfolios p 
        WHERE p.id = portfolio_id AND (p.user_id = auth.uid() OR p.is_public = true)
    )
);
CREATE POLICY "Users can insert portfolio assets" ON public.portfolio_assets FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.portfolios p 
        WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update portfolio assets" ON public.portfolio_assets FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.portfolios p 
        WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Users can delete portfolio assets" ON public.portfolio_assets FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.portfolios p 
        WHERE p.id = portfolio_id AND p.user_id = auth.uid()
    )
);

-- 同步检查点表策略
CREATE POLICY "Users can manage own sync checkpoints" ON public.sync_checkpoints FOR ALL USING (auth.uid() = user_id);

-- 手动冲突表策略
CREATE POLICY "Users can manage own conflicts" ON public.manual_conflicts FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 10. 性能优化设置
-- =============================================

-- 设置表的统计信息收集
ALTER TABLE public.user_profiles SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.accounts SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.assets SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.transactions SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.portfolios SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.portfolio_assets SET (autovacuum_analyze_scale_factor = 0.02);

-- 设置表的填充因子（为更新操作预留空间）
ALTER TABLE public.assets SET (fillfactor = 90);
ALTER TABLE public.transactions SET (fillfactor = 95);
ALTER TABLE public.portfolio_assets SET (fillfactor = 90);

-- 创建部分索引以提高性能
CREATE INDEX CONCURRENTLY idx_assets_active_holdings ON public.assets(user_id, symbol) WHERE quantity > 0;
CREATE INDEX CONCURRENTLY idx_transactions_recent ON public.transactions(user_id, transaction_date DESC) WHERE transaction_date >= NOW() - INTERVAL '1 year';
CREATE INDEX CONCURRENTLY idx_portfolios_performance ON public.portfolios(user_id, total_return_percentage DESC) WHERE is_active = true AND total_value > 0;

-- 更新表统计信息
ANALYZE public.user_profiles;
ANALYZE public.accounts;
ANALYZE public.assets;
ANALYZE public.transactions;
ANALYZE public.portfolios;
ANALYZE public.portfolio_assets;
ANALYZE public.sync_checkpoints;
ANALYZE public.manual_conflicts;

-- 完成迁移
SELECT 'Database optimization migration completed successfully' as status;