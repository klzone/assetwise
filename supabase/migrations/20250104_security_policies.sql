-- 启用行级安全策略
-- 为所有主要表启用RLS

-- 用户档案表的RLS策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和更新自己的档案
CREATE POLICY "用户只能查看自己的档案" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户只能更新自己的档案" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户可以插入自己的档案" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 资产表的RLS策略
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的资产" ON assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的资产" ON assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的资产" ON assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的资产" ON assets
  FOR DELETE USING (auth.uid() = user_id);

-- 交易记录表的RLS策略
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的交易记录" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的交易记录" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的交易记录" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的交易记录" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- 账户表的RLS策略
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的账户" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的账户" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的账户" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的账户" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- 投资组合表的RLS策略（新增）
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_allocation JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的投资组合" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的投资组合" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的投资组合" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的投资组合" ON portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- 投资组合资产关联表
CREATE TABLE IF NOT EXISTS portfolio_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  target_weight DECIMAL(5,4) DEFAULT 0.0000,
  current_weight DECIMAL(5,4) DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, asset_id)
);

ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;

-- 通过投资组合的用户ID来控制访问
CREATE POLICY "用户只能查看自己投资组合的资产" ON portfolio_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_assets.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "用户只能管理自己投资组合的资产" ON portfolio_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_assets.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- 审计日志表（用于安全监控）
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审计日志只允许插入，不允许更新或删除
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "只允许插入审计日志" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "用户只能查看自己的审计日志" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 创建审计触发器函数
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为主要表添加审计触发器
CREATE TRIGGER assets_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER transactions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER accounts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON accounts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER portfolios_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 创建安全函数来检查用户权限
CREATE OR REPLACE FUNCTION check_user_subscription(required_level TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_subscription TEXT;
BEGIN
  SELECT subscription_type INTO user_subscription
  FROM profiles
  WHERE id = auth.uid();
  
  CASE required_level
    WHEN 'free' THEN
      RETURN user_subscription IN ('free', 'professional', 'flagship');
    WHEN 'professional' THEN
      RETURN user_subscription IN ('professional', 'flagship');
    WHEN 'flagship' THEN
      RETURN user_subscription = 'flagship';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建数据完整性检查函数
CREATE OR REPLACE FUNCTION validate_transaction_data()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查交易金额是否为正数
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION '交易金额必须大于0';
  END IF;
  
  -- 检查交易日期不能是未来日期
  IF NEW.transaction_date > CURRENT_DATE THEN
    RAISE EXCEPTION '交易日期不能是未来日期';
  END IF;
  
  -- 检查资产是否属于同一用户
  IF NOT EXISTS (
    SELECT 1 FROM assets 
    WHERE id = NEW.asset_id 
    AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION '资产不属于当前用户';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_transaction_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION validate_transaction_data();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_assets_portfolio_id ON portfolio_assets(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_assets_updated_at
  BEFORE UPDATE ON portfolio_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();