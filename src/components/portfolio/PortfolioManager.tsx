import React, { useState } from 'react';
import { Portfolio } from '@/lib/types/portfolio.types';
import { PortfolioList } from './PortfolioList';
import { PortfolioForm } from './PortfolioForm';
import { PortfolioDetail } from './PortfolioDetail';

interface PortfolioManagerProps {
  userId: string;
}

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({ userId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');

  const handleCreatePortfolio = () => {
    setSelectedPortfolio(null);
    setViewMode('create');
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setViewMode('edit');
  };

  const handleViewPortfolio = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
    setViewMode('detail');
  };

  const handleDeletePortfolio = (portfolioId: string) => {
    // 删除逻辑在PortfolioList组件中处理
    console.log('删除投资组合:', portfolioId);
  };

  const handleSavePortfolio = (portfolio: Portfolio) => {
    setViewMode('list');
    setSelectedPortfolio(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedPortfolio(null);
    setSelectedPortfolioId('');
  };

  const handleAddAsset = (portfolioId: string) => {
    // TODO: 实现添加资产功能
    console.log('添加资产到投资组合:', portfolioId);
  };

  switch (viewMode) {
    case 'create':
    case 'edit':
      return (
        <PortfolioForm
          userId={userId}
          portfolio={selectedPortfolio}
          onSave={handleSavePortfolio}
          onCancel={handleCancel}
        />
      );

    case 'detail':
      return (
        <PortfolioDetail
          portfolioId={selectedPortfolioId}
          onBack={handleCancel}
          onEdit={handleEditPortfolio}
          onAddAsset={handleAddAsset}
        />
      );

    default:
      return (
        <PortfolioList
          userId={userId}
          onCreatePortfolio={handleCreatePortfolio}
          onEditPortfolio={handleEditPortfolio}
          onViewPortfolio={handleViewPortfolio}
          onDeletePortfolio={handleDeletePortfolio}
        />
      );
  }
};