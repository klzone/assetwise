import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // 禁用严格模式以避免开发时的双重渲染
  reactStrictMode: false,

  // 静态导出配置
  distDir: 'out',

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 为Tauri环境添加特殊处理
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // 添加对Tauri的支持
  experimental: {
    esmExternals: 'loose',
  },

  // 确保在Tauri环境下正确处理路由
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
};

export default nextConfig;
