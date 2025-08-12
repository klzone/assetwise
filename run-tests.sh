#!/bin/bash

# AssetWise 测试执行脚本
# 此脚本用于运行不同类型的测试，并生成测试报告

# 创建测试报告目录
mkdir -p test-reports/jest
mkdir -p test-reports/playwright

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

echo -e "${YELLOW}===== AssetWise 测试执行开始 =====${NC}"

# 运行 Jest 单元测试
echo -e "${YELLOW}正在运行 Jest 单元测试...${NC}"
pnpm jest --coverage --json --outputFile=test-reports/jest/test-results.json
JEST_EXIT_CODE=$?

if [ $JEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ Jest 单元测试通过${NC}"
else
  echo -e "${RED}✗ Jest 单元测试失败${NC}"
fi

# 运行 Playwright 端到端测试
echo -e "${YELLOW}正在运行 Playwright 端到端测试...${NC}"
pnpm exec playwright test
PLAYWRIGHT_EXIT_CODE=$?

if [ $PLAYWRIGHT_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ Playwright 端到端测试通过${NC}"
else
  echo -e "${RED}✗ Playwright 端到端测试失败${NC}"
fi

# 生成合并测试报告
echo -e "${YELLOW}正在生成测试报告...${NC}"
node scripts/generate-test-report.js

# 显示测试结果摘要
echo -e "${YELLOW}===== 测试执行完成 =====${NC}"
if [ $JEST_EXIT_CODE -eq 0 ] && [ $PLAYWRIGHT_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ 所有测试通过${NC}"
  exit 0
else
  echo -e "${RED}✗ 部分测试失败${NC}"
  exit 1
fi