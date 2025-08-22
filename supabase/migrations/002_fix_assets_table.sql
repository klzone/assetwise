-- 修复资产表结构以支持完整的数据同步
-- 2025-01-26: 添加缺失字段和修复ID类型

-- 首先备份现有数据
CREATE TABLE IF NOT EXISTS assets_backup AS SELECT * FROM public.assets;

-- 删除现有的资产表（如果有数据会先备份）
DROP TABLE IF EXISTS public.assets CASCADE;

-- 重新创建资产表，支持字符串ID和完整字段
CREATE TABLE public.assets (
  id TEXT PRIMARY KEY, -- 改为TEXT类型以支持自定义ID
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
  day_change DECIMAL(20, 8) DEFAULT 0, -- 添加日涨跌字段
  day_change_rate DECIMAL(10, 4) DEFAULT 0, -- 添加日涨跌百分比字段
  allocation DECIMAL(10, 4) DEFAULT 0, -- 添加配置占比字段
  risk_level TEXT DEFAULT 'medium', -- 添加风险等级字段
  logo_url TEXT, -- 添加图标URL字段
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, symbol) -- 简化唯一约束，只要求用户+符号唯一
);

-- 重新启用行级安全策略
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 重新创建资产策略
CREATE POLICY "Users can view their own assets" ON public.assets
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own assets" ON public.assets
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own assets" ON public.assets
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own assets" ON public.assets
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 重新创建更新时间触发器
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 如果有备份数据，尝试恢复（需要手动调整数据格式）
-- INSERT INTO public.assets (id, user_id, account_id, symbol, name, type, current_price, quantity, average_cost, total_value, profit_loss, profit_loss_percentage, last_updated, created_at, updated_at)
-- SELECT 
--   id::TEXT, 
--   user_id, 
--   account_id, 
--   symbol, 
--   name, 
--   type, 
--   current_price, 
--   quantity, 
--   average_cost, 
--   total_value, 
--   profit_loss, 
--   profit_loss_percentage, 
--   last_updated, 
--   created_at, 
--   updated_at
-- FROM assets_backup;

-- 清理备份表（可选）
-- DROP TABLE IF EXISTS assets_backup;

COMMENT ON TABLE public.assets IS '资产表 - 存储用户的投资资产信息';
COMMENT ON COLUMN public.assets.id IS '资产ID - 支持自定义字符串格式';
COMMENT ON COLUMN public.assets.day_change IS '日涨跌金额';
COMMENT ON COLUMN public.assets.day_change_rate IS '日涨跌百分比';
COMMENT ON COLUMN public.assets.allocation IS '在投资组合中的配置占比';
COMMENT ON COLUMN public.assets.risk_level IS '风险等级: low, medium, high';
COMMENT ON COLUMN public.assets.logo_url IS '资产图标URL';