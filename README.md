# AssetWise

AssetWise 是一个面向个人和家庭投资管理的资产工作台。它把资产持仓、交易记录、投资计划、复盘日志和组合分析放在同一个界面中，帮助用户更清晰地记录资产变化、执行投资纪律，并形成可回顾的长期投资档案。

## 功能概览

- 资产管理：支持资产列表、资产详情、价格维护、买入卖出记录和收益统计。
- 交易记录：统一管理交易流水，沉淀可追踪的投资行为数据。
- 投资计划：创建计划、跟踪执行进度，并把计划与资产和交易动作关联起来。
- 复盘洞察：记录阶段性复盘、纪律分、风险提示和经验沉淀。
- 组合分析：提供资产分布、收益变化、账户统计和图表化分析。
- 云端同步：集成 Supabase，用于认证、数据同步和跨端数据恢复。
- 本地优先：包含 localStorage、IndexedDB、SQLite/Tauri 等本地数据能力。
- 报告导出：支持 PDF 报告模板和资产报告生成。
- 响应式界面：覆盖桌面端和移动端，并支持深色模式。
- 桌面应用：通过 Tauri 构建跨平台桌面版本。
- 生产部署：包含 Docker、Nginx、Kubernetes、监控和 CI/CD 配置样例。

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Radix UI / shadcn 风格组件
- Zustand
- Supabase
- Recharts
- jsPDF / React PDF
- Jest / Testing Library / Playwright
- Tauri
- Docker / Nginx / Kubernetes

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Rust 和 Tauri CLI（仅桌面应用需要）
- Supabase 项目（启用云同步时需要）

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制环境变量示例：

```bash
cp .env.example .env.local
```

然后填写 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_NAME=AssetWise
NEXT_PUBLIC_APP_VERSION=1.0.0
```

`.env.local` 已被 `.gitignore` 排除，不应提交真实密钥。

### 启动开发服务

```bash
pnpm dev
```

默认访问地址：

```text
http://localhost:3000
```

### 启动桌面开发模式

```bash
pnpm tauri:dev
```

## 常用脚本

```bash
pnpm dev              # 启动 Next.js 开发服务
pnpm build            # 构建 Web 应用
pnpm start            # 启动生产服务
pnpm type-check       # TypeScript 类型检查
pnpm test             # 运行单元测试
pnpm test:coverage    # 生成测试覆盖率
pnpm test:e2e         # 运行 Playwright E2E 测试
pnpm tauri:build      # 构建桌面应用
```

## 项目结构

```text
assetwise-minimal/
├── src/
│   ├── app/                  # Next.js App Router 页面
│   ├── components/           # UI、布局、资产、计划、复盘、报表等组件
│   ├── contexts/             # React Context
│   ├── hooks/                # 自定义 Hooks
│   └── lib/                  # 数据服务、同步、分析、工具函数和类型
├── components/               # 旧版或共享组件
├── contexts/                 # 旧版或共享上下文
├── lib/                      # 旧版或共享服务层
├── public/                   # 静态资源和 PWA 文件
├── src-tauri/                # Tauri 桌面应用
├── scripts/                  # 开发、部署和测试辅助脚本
├── config/                   # 部署配置示例
├── nginx/                    # Nginx 配置
├── k8s/                      # Kubernetes 配置
├── monitoring/               # 监控配置
└── performance/              # 性能测试配置
```

## 数据与同步

AssetWise 同时保留本地优先和云端同步能力：

- 本地数据用于快速启动、离线使用和桌面端场景。
- Supabase 用于用户认证、云端数据存储和跨设备同步。
- 同步相关服务集中在 `src/lib/services`、`src/lib/supabase` 和 `src/lib/types` 中。

生产环境请使用真实的 Supabase 项目，并通过安全的环境变量管理服务端密钥。不要把 `.env.local`、数据库密码、服务端密钥或 Token 提交到仓库。

## 构建与部署

### Web 构建

```bash
pnpm build
pnpm start
```

### Docker

```bash
docker compose up --build
```

### Kubernetes

Kubernetes 配置位于 `k8s/`。部署前请先替换 Secret、镜像地址、域名和资源配置。

## 测试

```bash
pnpm type-check
pnpm test
pnpm test:e2e
```

当前仓库包含多组历史测试、同步测试、性能测试和安全测试脚本。不同环境下可能需要先补齐浏览器、数据库或 Supabase 测试配置。

## 设计方向

首页已更新为更紧凑的投资工作台布局，减少重复信息，突出资产概览、纪律执行、计划进展和复盘洞察。顶部导航合并了原先的侧边栏功能入口，让主界面更集中、更适合日常资产管理使用。

## 许可证

MIT License
