# AssetWise 多阶段 Docker 构建配置
# 优化镜像大小和安全性，支持生产环境部署

# 基础镜像阶段
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@8

# 安装系统依赖
RUN apk add --no-cache \
    libc6-compat \
    dumb-init

# 依赖安装阶段
FROM base AS deps

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 设置 pnpm 存储目录
RUN pnpm config set store-dir /pnpm-store

# 安装依赖（仅生产依赖）
RUN --mount=type=cache,id=pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile --prod

# 开发依赖安装阶段
FROM base AS dev-deps

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 设置 pnpm 存储目录
RUN pnpm config set store-dir /pnpm-store

# 安装所有依赖（包括开发依赖）
RUN --mount=type=cache,id=pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder

# 复制所有依赖
COPY --from=dev-deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 设置构建环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 执行构建
RUN pnpm run build

# 生产镜像阶段
FROM node:18-alpine AS runner

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 安装 dumb-init（用于正确处理信号）
RUN apk add --no-cache dumb-init

# 复制公共文件
COPY --from=builder /app/public ./public

# 设置正确的权限并复制构建产物
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 自动利用输出轨迹来减少镜像大小
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制生产依赖
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# 复制启动脚本
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./

# 确保脚本可执行
RUN chmod +x docker-entrypoint.sh

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# 设置入口点
ENTRYPOINT ["dumb-init", "--"]

# 启动命令
CMD ["./docker-entrypoint.sh"]