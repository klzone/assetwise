import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '投资组合管理 - AssetWise',
  description: '管理和分析您的投资组合，优化资产配置',
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}