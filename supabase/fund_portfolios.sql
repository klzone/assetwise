-- 创建基金组合表
CREATE TABLE IF NOT EXISTS fund_portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    portfolio_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    total_value DECIMAL(15,2) DEFAULT 0,
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_profit_rate DECIMAL(8,4) DEFAULT 0,
    holdings JSONB DEFAULT '[]'::jsonb,
    tiantian_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 创建索引
    CONSTRAINT unique_user_portfolio UNIQUE (user_id, portfolio_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fund_portfolios_user_id ON fund_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_portfolios_portfolio_id ON fund_portfolios(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_fund_portfolios_created_at ON fund_portfolios(created_at);

-- 启用行级安全策略
ALTER TABLE fund_portfolios ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许用户访问自己的数据）
CREATE POLICY "Users can view own fund portfolios" ON fund_portfolios
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own fund portfolios" ON fund_portfolios
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own fund portfolios" ON fund_portfolios
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own fund portfolios" ON fund_portfolios
    FOR DELETE USING (user_id = auth.uid()::text);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fund_portfolios_updated_at 
    BEFORE UPDATE ON fund_portfolios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();