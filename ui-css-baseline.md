# UI CSS 基线与对照

核心页面基线列表
- 登录页
- 顶部导航/侧边栏
- 资产列表页面
- 资产详情页
- 仪表盘

基线截图路径
- baseline_screenshots/login.png
- baseline_screenshots/dashboard.png
- baseline_screenshots/assets.png
- baseline_screenshots/asset-detail.png

对比策略
- 通过差异对比工具标注颜色、间距、字体差异。
- 阈值设定：颜色对比允许微小偏差，间距/字体偏差超过 2% 或 2px 视为需要关注。

输出物
- 对比报告：ui-css-diff-YYYYMMDD.md，记录差异、影响范围与修复建议
- 更新后的 UI 测试用例，覆盖核心组件的视觉回归点