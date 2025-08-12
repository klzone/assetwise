# 主题与语义色规范（AssetWise）

目标：建立“温和中性为底 + 亮色点缀”的明/暗双主题，统一语义色，支持极简 + 轻新拟态风格。

## 1. 设计原则
- 基底：中性灰阶，明（偏暖）/暗（偏冷灰蓝）
- 点缀：跳色建议（电光青 Cyan / 酸柠绿 Lime / 品红 Magenta，仅选其一为主色）
- 可访问：对比度 AA，状态清晰，动效克制（150–240ms）

## 2. 语义色（CSS 变量命名）
- 背景与文本：--background / --foreground / --card / --popover
- 边框与输入：--border / --input / --ring
- 功能语义：--primary / --secondary / --accent / --muted
- 反馈语义：--info / --success / --warning / --destructive
- 前景衍生：--*-foreground
- 圆角：--radius（基础 12px，可选 16/20 作为层级）

## 3. 建议色值（HSL，单位省略）
说明：保留现有蓝作为默认 primary，跳色用于 accent（可按页面风格切换）。以下为推荐值，可在编码落地时微调。

Light（:root）
- --background: 0 0% 100%
- --foreground: 222 84% 5%
- --card: 0 0% 100%
- --popover: 0 0% 100%
- --border: 214 32% 91%
- --input: 214 32% 91%
- --ring: 221 83% 53%
- --primary: 221 83% 53%            # 默认互动蓝（可沿用现状）
- --primary-foreground: 210 40% 98%
- --secondary: 210 40% 96%
- --secondary-foreground: 222 47% 11%
- --accent: 188 95% 46%              # 电光青（跳色，建议）
- --accent-foreground: 210 40% 98%
- --muted: 210 40% 96%
- --muted-foreground: 215 20% 65%
- --info: 201 100% 40%
- --info-foreground: 210 40% 98%
- --success: 146 58% 36%
- --success-foreground: 210 40% 98%
- --warning: 38 92% 50%
- --warning-foreground: 222 47% 11%
- --destructive: 0 84% 60%
- --destructive-foreground: 210 40% 98%
- --radius: 0.75rem  # 12px

Dark（.dark）
- --background: 222 84% 5%
- --foreground: 210 40% 98%
- --card: 222 84% 6%
- --popover: 222 84% 6%
- --border: 217 33% 18%
- --input: 217 33% 18%
- --ring: 224 76% 48%
- --primary: 217 92% 60%
- --primary-foreground: 222 47% 11%
- --secondary: 217 33% 17%
- --secondary-foreground: 210 40% 98%
- --accent: 188 95% 46%              # 同步电光青
- --accent-foreground: 210 40% 98%
- --muted: 217 33% 17%
- --muted-foreground: 215 20% 65%
- --info: 201 100% 55%
- --info-foreground: 222 47% 11%
- --success: 146 54% 46%
- --success-foreground: 222 47% 11%
- --warning: 38 92% 60%
- --warning-foreground: 222 47% 11%
- --destructive: 0 63% 31%
- --destructive-foreground: 210 40% 98%

说明：
- primary 作为主要交互色，默认采用蓝；accent 用于关键点缀与图表强调（满足“亮丽跳色”诉求）
- info/success/warning/destructive 均提供前景色，保证文本/图标可读

## 4. 新拟态与阴影
建议样式（Tailwind 可通过 utilities 或组件类组合实现）：
- 浮层投影（浅）：shadow-[0_6px_16px_rgba(0,0,0,0.08)]
- 浅内阴影：shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]
- 深层级：shadow-[0_12px_32px_rgba(0,0,0,0.14)]
- 圆角层级：12/16/20（基础/重要区块/顶层卡片）

## 5. 动效与焦点
- 动效：transition-[colors,opacity,transform] duration-200 ease-out
- 焦点环：focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2

## 6. 图表色板（Recharts/ECharts）
类别建议（明/暗自适配）：
- 主跳色系：Cyan 600/500（hsl 188 95% 46%）
- 辅助：Blue/Indigo/Teal/Lime/Magenta 分级
- 网格线与轴：中性灰（明：border 40% 透明；暗：border 60% 透明）
交互：
- 悬浮高亮、图例筛选、阈值线与标注、区间背景高亮

## 7. 使用指引
- Tailwind 使用：bg-background text-foreground border-border ring-ring
- 组件前景：text-primary / text-accent / text-destructive
- 表单：focus-visible:ring-ring focus-visible:ring-offset-background
- 图表主题：读取 CSS 变量转换为色值（建议在渲染时读取）

备注：编码落地时，会在 src/app/globals.css 更新变量并提供主题开关组件（UI 层），不改动业务逻辑。