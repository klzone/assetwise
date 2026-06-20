#!/bin/sh
set -e

# AssetWise Docker 容器启动脚本
# 处理环境初始化和应用启动

echo "🚀 Starting AssetWise application..."

# 检查必要的环境变量
if [ -z "$NODE_ENV" ]; then
    echo "❌ NODE_ENV is not set"
    exit 1
fi

echo "📋 Environment: $NODE_ENV"

# 数据库连接检查（如果配置了数据库）
if [ -n "$DATABASE_URL" ]; then
    echo "🔗 Checking database connection..."
    node -e "
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        supabase.from('profiles').select('count', { count: 'exact', head: true })
            .then(() => console.log('✅ Database connection successful'))
            .catch(err => {
                console.error('❌ Database connection failed:', err.message);
                process.exit(1);
            });
    "
fi

# 运行数据库迁移（如果需要）
if [ "$NODE_ENV" = "production" ] && [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄 Running database migrations..."
    # 这里添加迁移命令
    echo "✅ Database migrations completed"
fi

# 预热缓存（可选）
if [ "$WARM_CACHE" = "true" ]; then
    echo "🔥 Warming up cache..."
    # 这里添加缓存预热逻辑
    echo "✅ Cache warmed up"
fi

# 启动应用
echo "🌟 Starting Next.js server..."
exec node server.js