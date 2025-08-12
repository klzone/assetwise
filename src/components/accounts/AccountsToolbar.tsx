'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Plus, Search, Filter } from 'lucide-react';

/**
 * 账户列表页顶部工具栏（支持搜索、筛选、导入导出与新增）
 * - 响应式：移动端纵向堆叠，桌面端左右分栏
 * - 风格：极简 + 轻新拟态（通过柔和阴影与圆角）
 * - 语义色：依赖全局 CSS 变量，自动适配明/暗主题
 */

export type AccountTypeOption = {
  key: string;
  label: string;
  icon?: React.ReactNode;
};

export type AccountStatus = 'all' | 'active' | 'inactive';

type AccountsToolbarProps = {
  // 统计信息
  total?: number;
  active?: number;
  // 搜索
  search: string;
  onSearchChange: (v: string) => void;
  // 类型筛选
  type: string | 'all';
  typeOptions: AccountTypeOption[];
  onTypeChange: (v: string | 'all') => void;
  // 状态筛选
  status: AccountStatus;
  onStatusChange: (v: AccountStatus) => void;
  // 操作
  onCreate: () => void;
  onExport: () => void;
  onImport: () => void;
  // 额外插槽（可选）
  extraRight?: React.ReactNode;
  className?: string;
};

export function AccountsToolbar(props: AccountsToolbarProps) {
  const {
    total = 0,
    active = 0,
    search,
    onSearchChange,
    type,
    typeOptions,
    onTypeChange,
    status,
    onStatusChange,
    onCreate,
    onExport,
    onImport,
    extraRight,
    className = '',
  } = props;

  return (
    <div
      className={[
        'rounded-2xl border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'shadow-[inset_0_-1px_0_rgba(255,255,255,0.06),0_6px_24px_-12px_rgba(0,0,0,0.2)]',
        'p-4 md:p-5',
        className,
      ].join(' ')}
    >
      {/* 顶部：标题与统计 */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight">账户管理</h2>
            <Badge variant="secondary" className="rounded-full">
              总计 {total}
            </Badge>
            <Badge className="rounded-full">
              活跃 {active}
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            搜索、筛选与导入导出账户数据；支持新增账户与快速筛选不同账户类型和状态。
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Button size="sm" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增账户
          </Button>
          {extraRight}
        </div>
      </div>

      <Separator className="my-4" />

      {/* 底部：搜索与筛选（移动优先布局） */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        {/* 搜索框 */}
        <div className="relative md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            placeholder="搜索账户名称、机构或账户号码"
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* 筛选组 */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">筛选</span>
          </div>

          {/* 类型筛选 */}
          <Select value={type} onValueChange={(v) => onTypeChange(v as any)}>
            <SelectTrigger className="w-full md:w-[180px] h-9">
              <SelectValue placeholder="账户类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  <div className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 状态筛选 */}
          <Select value={status} onValueChange={(v) => onStatusChange(v as AccountStatus)}>
            <SelectTrigger className="w-full md:w-[140px] h-9">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">活跃</SelectItem>
              <SelectItem value="inactive">非活跃</SelectItem>
            </SelectContent>
          </Select>

          {/* 移动端操作按钮 */}
          <div className="flex md:hidden gap-2">
            <Button variant="outline" className="flex-1 h-9" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
            <Button variant="outline" className="flex-1 h-9" onClick={onImport}>
              <Upload className="mr-2 h-4 w-4" />
              导入
            </Button>
            <Button className="flex-1 h-9" onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              新增
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountsToolbar;