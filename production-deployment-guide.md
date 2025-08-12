# AssetWise生产环境构建和部署流程指南

## 概述

本文档详细说明了AssetWise资产管理应用的生产环境构建和部署流程。包括Web端和桌面端的构建配置、环境变量管理、CI/CD流水线设置、部署策略和监控配置。

## 目标

1. 建立自动化的构建和部署流程
2. 确保生产环境的稳定性和安全性
3. 实现零停机部署
4. 建立完善的监控和日志系统
5. 优化构建性能和部署速度

## 1. 环境配置

### 1.1 环境变量管理

创建不同环境的配置文件：

```bash
# .env.local (开发环境)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/assetwise_dev

# .env.staging (测试环境)
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
NEXTAUTH_SECRET=your-staging-nextauth-secret
NEXTAUTH_URL=https://staging.assetwise.com
NODE_ENV=production
REDIS_URL=redis://staging-redis:6379
DATABASE_URL=postgresql://user:password@staging-db:5432/assetwise_staging

# .env.production (生产环境)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
NEXTAUTH_SECRET=your-prod-nextauth-secret
NEXTAUTH_URL=https://app.assetwise.com
NODE_ENV=production
REDIS_URL=redis://prod-redis:6379
DATABASE_URL=postgresql://user:password@prod-db:5432/assetwise_prod
```

### 1.2 Next.js生产环境配置

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用React严格模式
  reactStrictMode: true,
  
  // 启用SWC编译器
  swcMinify: true,
  
  // 图片优化配置
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天
  },
  
  // 压缩配置
  compress: true,
  
  // 生产环境优化
  experimental: {
    // 启用并发特性
    concurrentFeatures: true,
    // 启用服务器组件
    serverComponents: true,
    // 启用边缘运行时
    runtime: 'edge',
  },
  
  // 构建优化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 生产环境优化
    if (!dev) {
      // 启用Tree Shaking
      config.optimization.usedExports = true;
      
      // 分割代码块
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
      
      // Bundle分析
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
    }
    
    return config;
  },
  
  // 安全头配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

// Sentry配置
const sentryWebpackPluginOptions = {
  silent: true,
  org: 'your-org',
  project: 'assetwise',
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

### 1.3 TypeScript生产环境配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "out", "dist"]
}
```

## 2. 构建脚本配置

### 2.1 Package.json脚本

```json
{
  "name": "assetwise",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "analyze": "ANALYZE=true npm run build",
    "build:staging": "NODE_ENV=production next build",
    "build:production": "NODE_ENV=production next build && npm run export",
    "export": "next export",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:release": "tauri build --release",
    "docker:build": "docker build -t assetwise .",
    "docker:run": "docker run -p 3000:3000 assetwise",
    "deploy:staging": "npm run build:staging && npm run deploy:vercel:staging",
    "deploy:production": "npm run build:production && npm run deploy:vercel:production",
    "deploy:vercel:staging": "vercel --prod --env staging",
    "deploy:vercel:production": "vercel --prod --env production"
  },
  "dependencies": {
    // 生产依赖...
  },
  "devDependencies": {
    // 开发依赖...
  }
}
```

### 2.2 构建优化脚本

```bash
#!/bin/bash
# scripts/build-optimized.sh

set -e

echo "🚀 开始优化构建流程..."

# 清理之前的构建
echo "🧹 清理构建缓存..."
rm -rf .next
rm -rf out
rm -rf dist

# 安装依赖
echo "📦 安装依赖..."
npm ci --only=production

# 类型检查
echo "🔍 执行类型检查..."
npm run type-check

# 代码检查
echo "🔧 执行代码检查..."
npm run lint

# 运行测试
echo "🧪 运行测试..."
npm run test

# 构建应用
echo "🏗️ 构建应用..."
npm run build

# 分析Bundle大小
if [ "$ANALYZE_BUNDLE" = "true" ]; then
  echo "📊 分析Bundle大小..."
  npm run analyze
fi

# 构建桌面应用
if [ "$BUILD_DESKTOP" = "true" ]; then
  echo "🖥️ 构建桌面应用..."
  npm run tauri:build:release
fi

echo "✅ 构建完成！"
```

## 3. Docker容器化

### 3.1 Dockerfile

```dockerfile
# Dockerfile
# 多阶段构建，优化镜像大小

# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 生产阶段
FROM node:18-alpine AS runner

# 设置工作目录
WORKDIR /app

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 设置文件权限
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT 3000
ENV NODE_ENV production

# 启动应用
CMD ["node", "server.js"]
```

### 3.2 Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Web应用
  assetwise-web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - assetwise-network

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - assetwise-network

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - assetwise-web
    restart: unless-stopped
    networks:
      - assetwise-network

volumes:
  redis-data:

networks:
  assetwise-network:
    driver: bridge
```

### 3.3 Nginx配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream assetwise {
        server assetwise-web:3000;
    }

    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    server {
        listen 80;
        server_name app.assetwise.com;
        
        # 重定向到HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name app.assetwise.com;

        # SSL配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # 静态文件缓存
        location /_next/static/ {
            alias /app/.next/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API路由
        location /api/ {
            proxy_pass http://assetwise;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # 主应用
        location / {
            proxy_pass http://assetwise;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## 4. CI/CD流水线

### 4.1 GitHub Actions配置

```yaml
# .github/workflows/deploy.yml
name: 部署到生产环境

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  # 代码质量检查
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: 安装pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: 获取pnpm存储目录
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: 设置pnpm缓存
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: 安装依赖
        run: pnpm install --frozen-lockfile

      - name: 类型检查
        run: pnpm run type-check

      - name: 代码检查
        run: pnpm run lint

      - name: 运行测试
        run: pnpm run test:coverage

      - name: 上传测试覆盖率
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  # 构建应用
  build:
    needs: quality-check
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: 安装pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: 安装依赖
        run: pnpm install --frozen-lockfile

      - name: 构建应用
        run: pnpm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: 上传构建产物
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: |
            .next/
            public/

  # 端到端测试
  e2e-test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: 安装pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: 安装依赖
        run: pnpm install --frozen-lockfile

      - name: 下载构建产物
        uses: actions/download-artifact@v3
        with:
          name: build-files

      - name: 安装Playwright
        run: pnpm exec playwright install --with-deps

      - name: 运行E2E测试
        run: pnpm run test:e2e

      - name: 上传测试报告
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  # 构建桌面应用
  build-desktop:
    needs: quality-check
    strategy:
      matrix:
        platform: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: 安装Rust
        uses: dtolnay/rust-toolchain@stable

      - name: 安装系统依赖 (Ubuntu)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf

      - name: 安装pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: 安装依赖
        run: pnpm install --frozen-lockfile

      - name: 构建桌面应用
        run: pnpm run tauri:build:release

      - name: 上传桌面应用
        uses: actions/upload-artifact@v3
        with:
          name: desktop-app-${{ matrix.platform }}
          path: src-tauri/target/release/bundle/

  # 部署到生产环境
  deploy-production:
    needs: [build, e2e-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 下载构建产物
        uses: actions/download-artifact@v3
        with:
          name: build-files

      - name: 部署到Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: 通知部署结果
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 4.2 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
VERSION=$(git rev-parse --short HEAD)

echo "🚀 开始部署到 $ENVIRONMENT 环境..."
echo "📦 版本: $VERSION"

# 检查环境参数
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "❌ 错误: 环境参数必须是 'staging' 或 'production'"
  exit 1
fi

# 构建应用
echo "🏗️ 构建应用..."
npm run build:$ENVIRONMENT

# 运行测试
echo "🧪 运行测试..."
npm run test

# 部署前检查
echo "🔍 部署前检查..."
if [ "$ENVIRONMENT" = "production" ]; then
  echo "⚠️  即将部署到生产环境，请确认："
  echo "   - 所有测试已通过"
  echo "   - 代码已经过审查"
  echo "   - 数据库迁移已完成"
  read -p "确认部署? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 部署已取消"
    exit 1
  fi
fi

# 执行部署
case $ENVIRONMENT in
  staging)
    echo "🚀 部署到测试环境..."
    vercel --prod --env staging
    ;;
  production)
    echo "🚀 部署到生产环境..."
    vercel --prod --env production
    
    # 部署后验证
    echo "✅ 验证部署..."
    curl -f https://app.assetwise.com/api/health || {
      echo "❌ 健康检查失败"
      exit 1
    }
    ;;
esac

echo "✅ 部署完成！"
echo "🔗 访问地址: https://$([[ $ENVIRONMENT == "production" ]] && echo "app" || echo "staging").assetwise.com"
```

## 5. 监控和日志

### 5.1 应用监控配置

```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

// 初始化Sentry
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // 过滤敏感信息
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('password')) {
        return null;
      }
    }
    return event;
  },
});

// 性能监控
export function trackPerformance(name: string, fn: () => Promise<any>) {
  return Sentry.startTransaction({ name }, async (transaction) => {
    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  });
}

// 用户行为追踪
export function trackUserAction(action: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: action,
    category: 'user-action',
    data: properties,
    level: 'info',
  });
}
```

### 5.2 健康检查API

```typescript
// src/pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      redis: 'unknown',
      external_apis: 'unknown',
    },
  };

  try {
    // 检查数据库连接
    const { error: dbError } = await supabase
      .from('health_check')
      .select('1')
      .limit(1);
    
    checks.checks.database = dbError ? 'unhealthy' : 'healthy';

    // 检查Redis连接
    if (process.env.REDIS_URL) {
      // Redis连接检查逻辑
      checks.checks.redis = 'healthy';
    }

    // 检查外部API
    checks.checks.external_apis = 'healthy';

    // 判断整体状态
    const isHealthy = Object.values(checks.checks).every(
      status => status === 'healthy'
    );
    
    checks.status = isHealthy ? 'healthy' : 'unhealthy';

    res.status(isHealthy ? 200 : 503).json(checks);
  } catch (error) {
    console.error('健康检查失败:', error);
    checks.status = 'unhealthy';
    res.status(503).json(checks);
  }
}
```

### 5.3 日志配置

```typescript
// src/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'assetwise',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// 生产环境添加文件日志
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

export default logger;
```

## 6. 性能优化

### 6.1 构建性能优化

```javascript
// webpack.config.js (如果需要自定义webpack配置)
const path = require('path');

module.exports = {
  // 启用持久化缓存
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
  
  // 优化解析
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  
  // 优化构建
  optimization: {
    // 启用Tree Shaking
    usedExports: true,
    sideEffects: false,
    
    // 代码分割
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};