@echo off
:: AssetWise 测试执行脚本 (Windows版本)
:: 此脚本用于运行不同类型的测试，并生成测试报告

:: 创建测试报告目录
mkdir test-reports\jest 2>nul
mkdir test-reports\playwright 2>nul

:: 颜色定义
set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set NC=[0m

echo %YELLOW%===== AssetWise 测试执行开始 =====%NC%

:: 运行 Jest 单元测试
echo %YELLOW%正在运行 Jest 单元测试...%NC%
call pnpm jest --coverage --json --outputFile=test-reports/jest/test-results.json
set JEST_EXIT_CODE=%ERRORLEVEL%

if %JEST_EXIT_CODE% EQU 0 (
  echo %GREEN%✓ Jest 单元测试通过%NC%
) else (
  echo %RED%✗ Jest 单元测试失败%NC%
)

:: 运行 Playwright 端到端测试
echo %YELLOW%正在运行 Playwright 端到端测试...%NC%
call pnpm exec playwright test
set PLAYWRIGHT_EXIT_CODE=%ERRORLEVEL%

if %PLAYWRIGHT_EXIT_CODE% EQU 0 (
  echo %GREEN%✓ Playwright 端到端测试通过%NC%
) else (
  echo %RED%✗ Playwright 端到端测试失败%NC%
)

:: 生成合并测试报告
echo %YELLOW%正在生成测试报告...%NC%
node scripts/generate-test-report.js

:: 显示测试结果摘要
echo %YELLOW%===== 测试执行完成 =====%NC%
if %JEST_EXIT_CODE% EQU 0 if %PLAYWRIGHT_EXIT_CODE% EQU 0 (
  echo %GREEN%✓ 所有测试通过%NC%
  exit /b 0
) else (
  echo %RED%✗ 部分测试失败%NC%
  exit /b 1
)