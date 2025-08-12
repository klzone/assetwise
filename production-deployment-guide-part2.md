# AssetWise生产环境构建和部署流程指南 - 第二部分

## 6. 性能优化（续）

### 6.2 运行时性能优化

```typescript
// src/lib/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// 性能指标收集
export function collectWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}

// 性能监控钩子
export function usePerformanceMonitor() {
  useEffect(() => {
    // 监控页面加载时间
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          console.log('页面加载时间:', entry.loadEventEnd - entry.fetchStart);
        }
      }
    });
    
    observer.observe({ entryTypes: ['navigation'] });
    
    return () => observer.disconnect();
  }, []);
}
```

### 6.3 资源优化

```javascript
// next.config.js 资源优化配置
const nextConfig = {
  // 图片优化
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天
  },
  
  // 字体优化
  optimizeFonts: true,
  
  // CSS优化
  experimental: {
    optimizeCss: true,
  },
  
  // 压缩配置
  compress: true,
  
  // PWA配置
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
          },
        },
      },
    ],
  },
};
```

## 7. 安全配置

### 7.1 内容安全策略(CSP)

```javascript
// next.config.js CSP配置
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app *.supabase.co;
  child-src *.youtube.com *.google.com *.supabase.co;
  style-src 'self' 'unsafe-inline' *.googleapis.com;
  img-src * blob: data:;
  media-src 'none';
  connect-src *;
  font-src 'self' *.gstatic.com;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'false',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 7.2 环境变量验证

```typescript
// src/lib/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

// 在应用启动时验证环境变量
export function validateEnvironment() {
  try {
    envSchema.parse(process.env);
    console.log('✅ 环境变量验证通过');
  } catch (error) {
    console.error('❌ 环境变量验证失败:', error);
    process.exit(1);
  }
}
```

## 8. 数据库迁移和备份

### 8.1 数据库迁移脚本

```sql
-- migrations/001_initial_schema.sql
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建资产表
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  price DECIMAL(15,2),
  fee DECIMAL(15,2) DEFAULT 0,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 8.2 备份脚本

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# 配置
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="assetwise_backup_${DATE}.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
echo "🗄️ 开始数据库备份..."
pg_dump $DATABASE_URL > "$BACKUP_DIR/$BACKUP_FILE"

# 压缩备份文件
echo "🗜️ 压缩备份文件..."
gzip "$BACKUP_DIR/$BACKUP_FILE"

# 上传到云存储（可选）
if [ "$UPLOAD_TO_S3" = "true" ]; then
  echo "☁️ 上传备份到S3..."
  aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" "s3://$S3_BACKUP_BUCKET/database/"
fi

# 清理旧备份（保留最近7天）
echo "🧹 清理旧备份..."
find $BACKUP_DIR -name "assetwise_backup_*.sql.gz" -mtime +7 -delete

echo "✅ 数据库备份完成: ${BACKUP_FILE}.gz"
```

### 8.3 恢复脚本

```bash
#!/bin/bash
# scripts/restore-database.sh

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ 错误: 请指定备份文件"
  echo "用法: $0 <backup_file>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 错误: 备份文件不存在: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  警告: 即将恢复数据库，这将覆盖现有数据"
read -p "确认继续? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 恢复已取消"
  exit 1
fi

# 解压备份文件（如果是压缩的）
if [[ $BACKUP_FILE == *.gz ]]; then
  echo "📦 解压备份文件..."
  gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# 恢复数据库
echo "🔄 恢复数据库..."
psql $DATABASE_URL < "$BACKUP_FILE"

echo "✅ 数据库恢复完成"
```

## 9. 部署后验证

### 9.1 自动化测试脚本

```bash
#!/bin/bash
# scripts/post-deploy-tests.sh

set -e

BASE_URL=${1:-https://app.assetwise.com}

echo "🧪 开始部署后验证测试..."
echo "🔗 测试地址: $BASE_URL"

# 健康检查
echo "🏥 健康检查..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
if [ "$response" != "200" ]; then
  echo "❌ 健康检查失败: HTTP $response"
  exit 1
fi
echo "✅ 健康检查通过"

# 首页加载测试
echo "🏠 首页加载测试..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$response" != "200" ]; then
  echo "❌ 首页加载失败: HTTP $response"
  exit 1
fi
echo "✅ 首页加载正常"

# API端点测试
echo "🔌 API端点测试..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/session")
if [ "$response" != "200" ]; then
  echo "❌ API端点测试失败: HTTP $response"
  exit 1
fi
echo "✅ API端点正常"

# 性能测试
echo "⚡ 性能测试..."
load_time=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL")
if (( $(echo "$load_time > 3.0" | bc -l) )); then
  echo "⚠️  警告: 页面加载时间较长: ${load_time}s"
else
  echo "✅ 页面加载性能良好: ${load_time}s"
fi

echo "🎉 部署后验证完成！"
```

### 9.2 监控告警配置

```yaml
# monitoring/alerts.yml
groups:
  - name: assetwise-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "高错误率告警"
          description: "应用错误率超过10%，持续5分钟"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "响应时间过长"
          description: "95%的请求响应时间超过1秒"

      - alert: DatabaseConnectionFailure
        expr: up{job="database"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "数据库连接失败"
          description: "无法连接到数据库"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "内存使用率过高"
          description: "内存使用率超过90%"
```

## 10. 回滚策略

### 10.1 快速回滚脚本

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "❌ 错误: 请指定要回滚的版本"
  echo "用法: $0 <version>"
  exit 1
fi

echo "🔄 开始回滚到版本: $PREVIOUS_VERSION"

# 确认回滚
echo "⚠️  警告: 即将回滚到之前的版本"
read -p "确认回滚? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 回滚已取消"
  exit 1
fi

# 执行回滚
echo "🚀 执行回滚..."
vercel rollback $PREVIOUS_VERSION --prod

# 验证回滚
echo "✅ 验证回滚..."
sleep 30  # 等待部署完成

response=$(curl -s -o /dev/null -w "%{http_code}" "https://app.assetwise.com/api/health")
if [ "$response" != "200" ]; then
  echo "❌ 回滚验证失败: HTTP $response"
  exit 1
fi

echo "✅ 回滚完成并验证成功"

# 发送通知
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"🔄 AssetWise已成功回滚到版本 $PREVIOUS_VERSION\"}" \
  $SLACK_WEBHOOK_URL
```

### 10.2 数据库回滚策略

```sql
-- migrations/rollback_template.sql
-- 回滚模板，根据具体迁移调整

BEGIN;

-- 1. 备份当前数据（如果需要）
CREATE TABLE backup_table_name AS SELECT * FROM table_name;

-- 2. 执行回滚操作
-- 删除新增的列
ALTER TABLE table_name DROP COLUMN IF EXISTS new_column;

-- 恢复旧的约束
ALTER TABLE table_name ADD CONSTRAINT old_constraint_name CHECK (condition);

-- 3. 验证回滚结果
SELECT COUNT(*) FROM table_name;

-- 如果一切正常，提交事务
COMMIT;

-- 如果有问题，回滚事务
-- ROLLBACK;
```

## 11. 总结

本生产环境构建和部署流程指南涵盖了AssetWise应用从开发到生产的完整流程，包括：

### 已实现的功能
1. ✅ 环境配置和变量管理
2. ✅ 构建脚本和优化配置
3. ✅ Docker容器化部署
4. ✅ CI/CD自动化流水线
5. ✅ 监控和日志系统
6. ✅ 性能优化策略
7. ✅ 安全配置和防护
8. ✅ 数据库迁移和备份
9. ✅ 部署后验证流程
10. ✅ 回滚策略和应急预案

### 关键优化点
- **构建性能**: 通过缓存、代码分割和Tree Shaking优化构建速度和包大小
- **运行时性能**: 实现懒加载、预加载和缓存策略
- **安全性**: 配置CSP、安全头和环境变量验证
- **可靠性**: 建立健康检查、监控告警和自动回滚机制
- **可维护性**: 提供完整的日志、备份和恢复流程

### 部署流程总览
1. **代码提交** → 触发CI/CD流水线
2. **质量检查** → 类型检查、代码检查、单元测试
3. **构建应用** → Web端和桌面端构建
4. **端到端测试** → 自动化E2E测试验证
5. **部署到生产** → 自动部署到Vercel/云平台
6. **部署后验证** → 健康检查和性能验证
7. **监控告警** → 持续监控应用状态

这套完整的部署流程确保了AssetWise应用能够安全、稳定、高效地运行在生产环境中。