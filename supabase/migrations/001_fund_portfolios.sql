-- 创建基金组合表
CREATE TABLE IF NOT EXISTS fund_portfolios (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_value DECIMAL(15,2) DEFAULT 0,
  total_profit DECIMAL(15,2) DEFAULT 0,
  total_profit_rate DECIMAL(8,4) DEFAULT 0,
  tiantian_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建基金持仓表
CREATE TABLE IF NOT EXISTS fund_holdings (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT REFERENCES fund_portfolios(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  nav DECIMAL(10,4) NOT NULL,
  holding_amount DECIMAL(15,2) NOT NULL,
  shares DECIMAL(15,4),
  cost_price DECIMAL(10,4),
  profit DECIMAL(15,2),
  profit_rate DECIMAL(8,4),
  weight DECIMAL(8,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fund_portfolios_user_id ON fund_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_holdings_portfolio_id ON fund_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_fund_portfolios_updated_at ON fund_portfolios(updated_at);

-- 启用行级安全策略
ALTER TABLE fund_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_holdings ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 用户只能访问自己的数据
CREATE POLICY "Users can view own portfolios" ON fund_portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios" ON fund_portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON fund_portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON fund_portfolios
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own holdings" ON fund_holdings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fund_portfolios 
      WHERE fund_portfolios.id = fund_holdings.portfolio_id 
      AND fund_portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own holdings" ON fund_holdings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM fund_portfolios 
      WHERE fund_portfolios.id = fund_holdings.portfolio_id 
      AND fund_portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own holdings" ON fund_holdings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM fund_portfolios 
      WHERE fund_portfolios.id = fund_holdings.portfolio_id 
      AND fund_portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own holdings" ON fund_holdings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM fund_portfolios 
      WHERE fund_portfolios.id = fund_holdings.portfolio_id 
      AND fund_portfolios.user_id = auth.uid()
    )
  );

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表添加更新时间触发器
CREATE TRIGGER update_fund_portfolios_updated_at 
  BEFORE UPDATE ON fund_portfolios 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fund_holdings_updated_at 
  BEFORE UPDATE ON fund_holdings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();