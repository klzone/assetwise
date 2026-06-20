/**
 * 修复同步问题的脚本
 * 解决本地资产状态与Supabase数据不一致的问题
 */

import { assetSyncFixService } from '../services/asset-sync-fix.service';
import { assetStorage } from '../asset-storage';

export class SyncIssuesFixer {
  
  /**
   * 执行完整的同步修复流程
   */
  async executeFullFix(): Promise<{
    success: boolean;
    message: string;
    steps: Array<{ step: string; success: boolean; message: string; details?: any }>;
  }> {
    const steps: Array<{ step: string; success: boolean; message: string; details?: any }> = [];
    
    console.log('🔧 开始执行完整的同步修复流程...');

    try {
      // 步骤1: 清理本地已删除资产
      console.log('📝 步骤1: 清理本地已删除资产');
      try {
        assetSyncFixService.cleanupLocalDeletedAssets();
        steps.push({
          step: '清理本地已删除资产',
          success: true,
          message: '本地已删除资产清理完成'
        });
      } catch (error) {
        steps.push({
          step: '清理本地已删除资产',
          success: false,
          message: `清理失败: ${error instanceof Error ? error.message : '未知错误'}`
        });
      }

      // 步骤2: 验证修复前状态
      console.log('🔍 步骤2: 验证修复前状态');
      const beforeValidation = await assetSyncFixService.validateSyncResult();
      steps.push({
        step: '修复前状态验证',
        success: beforeValidation.success,
        message: beforeValidation.message,
        details: beforeValidation.comparison
      });

      // 步骤3: 强制同步资产状态
      console.log('🚀 步骤3: 强制同步资产状态');
      const syncResult = await assetSyncFixService.forceSyncAssetState();
      steps.push({
        step: '强制同步资产状态',
        success: syncResult.success,
        message: syncResult.message,
        details: syncResult.details
      });

      // 步骤4: 验证修复后状态
      console.log('✅ 步骤4: 验证修复后状态');
      const afterValidation = await assetSyncFixService.validateSyncResult();
      steps.push({
        step: '修复后状态验证',
        success: afterValidation.success,
        message: afterValidation.message,
        details: afterValidation.comparison
      });

      // 步骤5: 清理交易记录重复项
      console.log('🧹 步骤5: 清理交易记录重复项');
      try {
        assetStorage.cleanupDuplicateTransactions();
        steps.push({
          step: '清理交易记录重复项',
          success: true,
          message: '交易记录重复项清理完成'
        });
      } catch (error) {
        steps.push({
          step: '清理交易记录重复项',
          success: false,
          message: `清理失败: ${error instanceof Error ? error.message : '未知错误'}`
        });
      }

      // 判断整体修复是否成功
      const allStepsSuccessful = steps.every(step => step.success);
      const finalValidation = steps[steps.length - 1];
      const isDataConsistent = finalValidation.details?.isConsistent || false;

      const overallSuccess = allStepsSuccessful && isDataConsistent;

      return {
        success: overallSuccess,
        message: overallSuccess 
          ? '✅ 同步问题修复完成，数据已保持一致' 
          : '⚠️ 修复过程中遇到问题，请检查详细信息',
        steps
      };

    } catch (error) {
      console.error('❌ 修复流程执行失败:', error);
      
      steps.push({
        step: '修复流程执行',
        success: false,
        message: `修复流程失败: ${error instanceof Error ? error.message : '未知错误'}`
      });

      return {
        success: false,
        message: '❌ 修复流程执行失败',
        steps
      };
    }
  }

  /**
   * 快速诊断同步问题
   */
  async quickDiagnosis(): Promise<{
    hasIssues: boolean;
    issues: string[];
    recommendations: string[];
    localAssets: number;
    cloudAssets: number;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 检查本地资产状态
      const localAssets = assetStorage.getLocalAssets();
      const allLocalAssets = assetStorage.getAllAssets();
      const deletedAssets = allLocalAssets.filter(asset => asset.isDeleted);

      console.log(`📊 诊断结果: 本地活跃资产 ${localAssets.length} 个，已删除资产 ${deletedAssets.length} 个`);

      // 检查云端资产状态
      const validation = await assetSyncFixService.validateSyncResult();
      const cloudAssets = validation.comparison?.cloud.count || 0;

      console.log(`☁️ 云端资产: ${cloudAssets} 个`);

      // 检查数据一致性
      if (localAssets.length !== cloudAssets) {
        issues.push(`数据不一致: 本地${localAssets.length}个资产，云端${cloudAssets}个资产`);
        recommendations.push('执行强制同步以解决数据不一致问题');
      }

      // 检查是否有已删除但未清理的资产
      if (deletedAssets.length > 0) {
        issues.push(`本地存在${deletedAssets.length}个已删除但未清理的资产`);
        recommendations.push('清理本地已删除资产标记');
      }

      // 检查交易记录
      const transactions = assetStorage.getTransactions();
      const duplicateTransactions = this.findDuplicateTransactions(transactions);
      if (duplicateTransactions.length > 0) {
        issues.push(`发现${duplicateTransactions.length}条重复交易记录`);
        recommendations.push('清理重复的交易记录');
      }

      // 检查同步状态
      const syncStatus = assetStorage.getSyncStatus();
      if (syncStatus.needsSync) {
        issues.push('存在未同步的本地更改');
        recommendations.push('执行云端同步');
      }

      return {
        hasIssues: issues.length > 0,
        issues,
        recommendations,
        localAssets: localAssets.length,
        cloudAssets
      };

    } catch (error) {
      console.error('❌ 诊断过程失败:', error);
      return {
        hasIssues: true,
        issues: [`诊断失败: ${error instanceof Error ? error.message : '未知错误'}`],
        recommendations: ['请检查网络连接和用户登录状态'],
        localAssets: 0,
        cloudAssets: 0
      };
    }
  }

  /**
   * 查找重复的交易记录
   */
  private findDuplicateTransactions(transactions: any[]): any[] {
    const seen = new Set<string>();
    const duplicates: any[] = [];

    transactions.forEach(transaction => {
      const key = `${transaction.assetId}-${transaction.type}-${transaction.date}-${transaction.price}-${transaction.quantity}`;
      if (seen.has(key)) {
        duplicates.push(transaction);
      } else {
        seen.add(key);
      }
    });

    return duplicates;
  }

  /**
   * 生成修复报告
   */
  generateFixReport(fixResult: any): string {
    let report = '# AssetWise 同步问题修复报告\n\n';
    
    report += `## 修复结果: ${fixResult.success ? '✅ 成功' : '❌ 失败'}\n\n`;
    report += `**总体状态**: ${fixResult.message}\n\n`;
    
    report += '## 修复步骤详情\n\n';
    fixResult.steps.forEach((step: any, index: number) => {
      report += `### ${index + 1}. ${step.step}\n`;
      report += `- **状态**: ${step.success ? '✅ 成功' : '❌ 失败'}\n`;
      report += `- **信息**: ${step.message}\n`;
      
      if (step.details) {
        report += `- **详细信息**:\n`;
        if (step.details.local && step.details.cloud) {
          report += `  - 本地资产: ${step.details.local.count} 个\n`;
          report += `  - 云端资产: ${step.details.cloud.count} 个\n`;
          report += `  - 数据一致性: ${step.details.isConsistent ? '✅ 一致' : '❌ 不一致'}\n`;
        }
        if (step.details.deleted !== undefined) {
          report += `  - 删除的云端资产: ${step.details.deleted} 个\n`;
        }
        if (step.details.synced !== undefined) {
          report += `  - 同步的本地资产: ${step.details.synced} 个\n`;
        }
      }
      report += '\n';
    });

    report += '## 建议\n\n';
    if (fixResult.success) {
      report += '- ✅ 数据同步问题已解决\n';
      report += '- 📱 本地资产状态与云端保持一致\n';
      report += '- 🔄 后续的删除/卖出操作将自动同步到云端\n';
    } else {
      report += '- ⚠️ 部分问题可能需要手动处理\n';
      report += '- 🔍 请检查网络连接和用户登录状态\n';
      report += '- 🔄 可以尝试重新执行修复流程\n';
    }

    return report;
  }
}

export const syncIssuesFixer = new SyncIssuesFixer();