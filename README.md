# AssetWise

一个现代化的投资组合管理应用，帮助用户跟踪投资、分析表现并做出明智的投资决策。

## 🚀 新功能：Supabase 集成

AssetWise 现已集成 Supabase，提供：
- ✅ 真实的用户认证系统
- ✅ 云端数据库存储
- ✅ 实时数据同步
- ✅ 行级安全策略
- ✅ 自动备份

## 功能特性

- 📊 投资组合跟踪
- 💰 交易记录管理
- 📈 资产分析
- 📝 复盘日志
- 🔐 用户认证 (Supabase)
- 📱 响应式设计
- 🌙 深色模式支持
- ☁️ 云端数据同步

## 技术栈

- **前端**: Next.js 14, React, TypeScript
- **样式**: Tailwind CSS, shadcn/ui
- **状态管理**: Zustand
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **桌面应用**: Tauri 2.0
- **图表**: Recharts
- **测试**: Jest, React Testing Library

## 快速开始

### 环境要求

- Node.js 18+
- pnpm
- Rust (用于 Tauri)
- Supabase 账号

### 1. 克隆项目

```bash
git clone <repository-url>
cd assetwise-app
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 设置 Supabase

1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 复制项目 URL 和 API 密钥
3. 复制 `.env.example` 为 `.env.local`
4. 填入 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. 在 Supabase SQL 编辑器中执行 `supabase/schema.sql`

详细设置指南请查看：[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 4. 开发模式

```bash
# 启动 Web 开发服务器
pnpm dev

# 启动 Tauri 开发模式
pnpm tauri dev
```

### 5. 测试 Supabase 连接

访问 `http://localhost:3000/supabase-test` 测试数据库连接

### 构建

```bash
# 构建 Web 应用
pnpm build

# 构建 Tauri 应用
pnpm tauri build
```

## 项目结构

```
src/
├── app/                 # Next.js 应用路由
├── components/          # React 组件
├── lib/                 # 工具库和服务
│   ├── supabase/        # Supabase 配置
│   ├── services/        # 数据服务
│   └── types/           # 类型定义
├── hooks/               # 自定义 Hooks
└── store/               # 状态管理
```

## 开发指南

### 添加新功能

1. 在 `src/app` 中创建新页面
2. 在 `src/components` 中创建相关组件
3. 在 `src/lib/services` 中添加数据服务
4. 更新状态管理（如需要）

### 测试

```bash
# 运行测试
pnpm test

# 运行测试覆盖率
pnpm test:coverage
```

## 部署

### Web 部署

应用支持静态导出，可以部署到任何静态托管服务：

```bash
pnpm build
```

### 桌面应用

使用 Tauri 构建跨平台桌面应用：

```bash
pnpm tauri build
```

## 故障排除

如果遇到认证或数据库问题：

1. 检查 `.env.local` 中的 Supabase 配置
2. 确认已执行数据库 schema
3. 访问 `/supabase-test` 页面进行诊断
4. 查看 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 详细指南

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
