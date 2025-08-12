#!/bin/bash

# AssetWise全面回归测试执行脚本
# 用于执行所有回归测试并生成测试报告

# 设置颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 显示标题
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}    AssetWise 资产管理应用全面回归测试    ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# 创建测试报告目录
REPORT_DIR="test-reports/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p $REPORT_DIR

# 记录测试开始时间
START_TIME=$(date +%s)
echo -e "${BLUE}测试开始时间: $(date)${NC}" | tee -a "$REPORT_DIR/summary.log"
echo "" | tee -a "$REPORT_DIR/summary.log"

# 运行认证状态管理测试
echo -e "${YELLOW}[1/4] 运行认证状态管理测试...${NC}" | tee -a "$REPORT_DIR/summary.log"
npx playwright test auth-state-management.test.ts --reporter=html,line --output="$REPORT_DIR/auth-state-management"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ 认证状态管理测试通过${NC}" | tee -a "$REPORT_DIR/summary.log"
else
  echo -e "${RED}✗ 认证状态管理测试失败${NC}" | tee -a "$REPORT_DIR/summary.log"
fi
echo "" | tee -a "$REPORT_DIR/summary.log"

# 运行资源所有权验证测试
echo -e "${YELLOW}[2/4] 运行资源所有权验证测试...${NC}" | tee -a "$REPORT_DIR/summary.log"
npx playwright test resource-ownership.test.ts --reporter=html,line --output="$REPORT_DIR/resource-ownership"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ 资源所有权验证测试通过${NC}" | tee -a "$REPORT_DIR/summary.log"
else
  echo -e "${RED}✗ 资源所有权验证测试失败${NC}" | tee -a "$REPORT_DIR/summary.log"
fi
echo "" | tee -a "$REPORT_DIR/summary.log"

# 运行CSRF保护测试
echo -e "${YELLOW}[3/4] 运行CSRF保护测试...${NC}" | tee -a "$REPORT_DIR/summary.log"
npx playwright test csrf-protection.test.ts --reporter=html,line --output="$REPORT_DIR/csrf-protection"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ CSRF保护测试通过${NC}" | tee -a "$REPORT_DIR/summary.log"
else
  echo -e "${RED}✗ CSRF保护测试失败${NC}" | tee -a "$REPORT_DIR/summary.log"
fi
echo "" | tee -a "$REPORT_DIR/summary.log"

# 运行密码强度验证测试
echo -e "${YELLOW}[4/4] 运行密码强度验证测试...${NC}" | tee -a "$REPORT_DIR/summary.log"
npx playwright test password-validation.test.ts --reporter=html,line --output="$REPORT_DIR/password-validation"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ 密码强度验证测试通过${NC}" | tee -a "$REPORT_DIR/summary.log"
else
  echo -e "${RED}✗ 密码强度验证测试失败${NC}" | tee -a "$REPORT_DIR/summary.log"
fi
echo "" | tee -a "$REPORT_DIR/summary.log"

# 记录测试结束时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo -e "${BLUE}测试结束时间: $(date)${NC}" | tee -a "$REPORT_DIR/summary.log"
echo -e "${BLUE}测试总耗时: $(($DURATION / 60)) 分 $(($DURATION % 60)) 秒${NC}" | tee -a "$REPORT_DIR/summary.log"
echo "" | tee -a "$REPORT_DIR/summary.log"

# 生成测试报告摘要
echo -e "${BLUE}生成测试报告摘要...${NC}"
echo "# AssetWise 全面回归测试报告" > "$REPORT_DIR/report.md"
echo "" >> "$REPORT_DIR/report.md"
echo "## 测试执行摘要" >> "$REPORT_DIR/report.md"
echo "" >> "$REPORT_DIR/report.md"
echo "- 测试执行日期: $(date +%Y-%m-%d)" >> "$REPORT_DIR/report.md"
echo "- 测试环境: 开发环境" >> "$REPORT_DIR/report.md"
echo "- 测试版本: $(cat ../package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')" >> "$REPORT_DIR/report.md"
echo "- 测试执行人: 自动化测试系统" >> "$REPORT_DIR/report.md"
echo "- 测试总耗时: $(($DURATION / 60)) 分 $(($DURATION % 60)) 秒" >> "$REPORT_DIR/report.md"
echo "" >> "$REPORT_DIR/report.md"

# 统计测试结果
PASSED_TESTS=$(grep -c "✓" "$REPORT_DIR/summary.log")
FAILED_TESTS=$(grep -c "✗" "$REPORT_DIR/summary.log")
TOTAL_TESTS=$((PASSED_TESTS + FAILED_TESTS))
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "## 测试结果摘要" >> "$REPORT_DIR/report.md"
echo "" >> "$REPORT_DIR/report.md"
echo "| 测试类型 | 测试用例数 | 通过数 | 失败数 | 通过率 |" >> "$REPORT_DIR/report.md"
echo "|---------|-----------|-------|-------|-------|" >> "$REPORT_DIR/report.md"
echo "| 认证状态管理测试 | 4 | $(grep -c "认证状态管理测试通过" "$REPORT_DIR/summary.log") | $(grep -c "认证状态管理测试失败" "$REPORT_DIR/summary.log") | $(if grep -q "认证状态管理测试通过" "$REPORT_DIR/summary.log"; then echo "100%"; else echo "0%"; fi) |" >> "$REPORT_DIR/report.md"
echo "| 资源所有权验证测试 | 3 | $(grep -c "资源所有权验证测试通过" "$REPORT_DIR/summary.log") | $(grep -c "资源所有权验证测试失败" "$REPORT_DIR/summary.log") | $(if grep -q "资源所有权验证测试通过" "$REPORT_DIR/summary.log"; then echo "100%"; else echo "0%"; fi) |" >> "$REPORT_DIR/report.md"
echo "| CSRF保护测试 | 5 | $(grep -c "CSRF保护测试通过" "$REPORT_DIR/summary.log") | $(grep -c "CSRF保护测试失败" "$REPORT_DIR/summary.log") | $(if grep -q "CSRF保护测试通过" "$REPORT_DIR/summary.log"; then echo "100%"; else echo "0%"; fi) |" >> "$REPORT_DIR/report.md"
echo "| 密码强度验证测试 | 6 | $(grep -c "密码强度验证测试通过" "$REPORT_DIR/summary.log") | $(grep -c "密码强度验证测试失败" "$REPORT_DIR/summary.log") | $(if grep -q "密码强度验证测试通过" "$REPORT_DIR/summary.log"; then echo "100%"; else echo "0%"; fi) |" >> "$REPORT_DIR/report.md"
echo "| **总计** | **$TOTAL_TESTS** | **$PASSED_TESTS** | **$FAILED_TESTS** | **${PASS_RATE}%** |" >> "$REPORT_DIR/report.md"
echo "" >> "$REPORT_DIR/report.md"

# 添加测试结论
echo "## 测试结论" >> "$REPORT_DIR/report.md"
echo "" >> "$REPORT_DIR/report.md"
if [ $PASS_RATE -eq 100 ]; then
  echo "- 回归测试结果: **通过**" >> "$REPORT_DIR/report.md"
  echo "- 所有修复的问题已经得到验证，系统可以进入下一阶段测试。" >> "$REPORT_DIR/report.md"
else
  echo "- 回归测试结果: **不通过**" >> "$REPORT_DIR/report.md"
  echo "- 存在未通过的测试，需要进一步修复和验证。" >> "$REPORT_DIR/report.md"
  echo "" >> "$REPORT_DIR/report.md"
  echo "### 失败的测试" >> "$REPORT_DIR/report.md"
  echo "" >> "$REPORT_DIR/report.md"
  grep "✗" "$REPORT_DIR/summary.log" | sed 's/✗/- /g' >> "$REPORT_DIR/report.md"
fi
echo "" >> "$REPORT_DIR/report.md"

# 添加下一步建议
echo "## 下一步建议" >> "$REPORT_DIR/report.md"
echo "" >> "$REPORT_DIR/report.md"
if [ $PASS_RATE -eq 100 ]; then
  echo "1. 进行资产管理核心功能测试" >> "$REPORT_DIR/report.md"
  echo "2. 进行数据同步和AI分析模块测试" >> "$REPORT_DIR/report.md"
  echo "3. 准备最终测试报告" >> "$REPORT_DIR/report.md"
else
  echo "1. 修复失败的测试" >> "$REPORT_DIR/report.md"
  echo "2. 重新运行回归测试" >> "$REPORT_DIR/report.md"
  echo "3. 完成所有测试后再进入下一阶段" >> "$REPORT_DIR/report.md"
fi

# 显示测试报告路径
echo -e "${GREEN}测试报告已生成: $REPORT_DIR/report.md${NC}"
echo -e "${GREEN}HTML报告已生成: $REPORT_DIR/*/playwright-report/index.html${NC}"

# 显示测试结果摘要
echo ""
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}                测试结果摘要                ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}总测试数: $TOTAL_TESTS${NC}"
echo -e "${GREEN}通过测试数: $PASSED_TESTS${NC}"
echo -e "${RED}失败测试数: $FAILED_TESTS${NC}"
echo -e "${BLUE}通过率: ${PASS_RATE}%${NC}"
echo -e "${BLUE}=================================================${NC}"

# 根据测试结果返回退出码
if [ $PASS_RATE -eq 100 ]; then
  exit 0
else
  exit 1
fi