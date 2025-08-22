#!/bin/bash
# 执行数据库迁移以修复表结构

echo "🔄 开始执行数据库迁移..."

# 检查是否安装了 Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装"
    echo "💡 请先安装 Supabase CLI:"
    echo "   npm install -g supabase"
    exit 1
fi

# 执行迁移
echo "📤 推送数据库迁移..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移执行成功!"
else
    echo "❌ 数据库迁移执行失败"
    echo "💡 请检查 Supabase 项目配置和网络连接"
fi
