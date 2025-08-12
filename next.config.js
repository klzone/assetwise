/** @type {import('next').NextConfig} */
const nextConfig = {
  // 安全头配置
  async headers() {
    return [
      {
        // 应用到所有路由
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
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://luhqkfsdffkmpwqyjjyh.supabase.co wss://luhqkfsdffkmpwqyjjyh.supabase.co",
              "frame-src 'none'",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
  },
  // 图片优化配置
  images: {
    domains: ['luhqkfsdffkmpwqyjjyh.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  // 压缩配置
  compress: true,
  // 生产环境优化
  swcMinify: true,
  // 静态文件缓存
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ]
  },
}

module.exports = nextConfig