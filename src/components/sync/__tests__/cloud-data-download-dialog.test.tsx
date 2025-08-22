import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CloudDataDownloadDialog } from '../cloud-data-download-dialog';
import { useCloudDataDownload } from '@/hooks/useCloudDataDownload';

// Mock the hook
jest.mock('@/hooks/useCloudDataDownload');

const mockUseCloudDataDownload = useCloudDataDownload as jest.MockedFunction<typeof useCloudDataDownload>;

describe('CloudDataDownloadDialog', () => {
  const mockHookReturn = {
    isDownloading: false,
    isPaused: false,
    isConnected: true,
    downloadItems: [
      {
        id: 'assets',
        name: '资产数据',
        type: 'assets' as const,
        size: 2.5 * 1024 * 1024,
        count: 150,
        status: 'pending' as const,
        progress: 0,
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        id: 'transactions',
        name: '交易记录',
        type: 'transactions' as const,
        size: 5.2 * 1024 * 1024,
        count: 300,
        status: 'completed' as const,
        progress: 100,
        lastUpdated: '2024-01-15T09:30:00Z'
      }
    ],
    overallProgress: 50,
    downloadStats: {
      totalItems: 2,
      completedItems: 1,
      failedItems: 0,
      totalSize: 7.7 * 1024 * 1024,
      downloadedSize: 5.2 * 1024 * 1024,
      startTime: new Date('2024-01-15T10:00:00Z'),
      estimatedTime: 30,
      speed: 1024 * 1024
    },
    startDownload: jest.fn(),
    pauseDownload: jest.fn(),
    resumeDownload: jest.fn(),
    cancelDownload: jest.fn(),
    resetDownload: jest.fn(),
    retryFailedItems: jest.fn(),
    refreshData: jest.fn(),
    formatFileSize: jest.fn((bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`),
    formatTime: jest.fn((seconds) => `${seconds}秒`),
    getTypeIcon: jest.fn(() => 'Database'),
    getStatusColor: jest.fn(() => 'bg-blue-500')
  };

  beforeEach(() => {
    mockUseCloudDataDownload.mockReturnValue(mockHookReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染对话框触发器', () => {
    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    expect(screen.getByRole('button', { name: '下载云端数据' })).toBeInTheDocument();
  });

  it('应该在点击触发器后打开对话框', async () => {
    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    const trigger = screen.getByRole('button', { name: '下载云端数据' });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('下载云端数据')).toBeInTheDocument();
      expect(screen.getByText('从 Supabase 云端同步您的账户数据和资源到本地设备')).toBeInTheDocument();
    });
  });

  it('应该显示正确的下载进度', async () => {
    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 总项目
      expect(screen.getByText('1')).toBeInTheDocument(); // 已完成
      expect(screen.getByText('0')).toBeInTheDocument(); // 失败
    });
  });

  it('应该显示下载项目列表', async () => {
    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      expect(screen.getByText('资产数据')).toBeInTheDocument();
      expect(screen.getByText('交易记录')).toBeInTheDocument();
      expect(screen.getByText('150 项')).toBeInTheDocument();
      expect(screen.getByText('300 项')).toBeInTheDocument();
    });
  });

  it('应该在网络断开时显示警告', async () => {
    mockUseCloudDataDownload.mockReturnValue({
      ...mockHookReturn,
      isConnected: false
    });

    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      expect(screen.getByText('网络断开')).toBeInTheDocument();
    });
  });

  it('应该在下载中时显示暂停按钮', async () => {
    mockUseCloudDataDownload.mockReturnValue({
      ...mockHookReturn,
      isDownloading: true
    });

    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /暂停/ })).toBeInTheDocument();
    });
  });

  it('应该在暂停时显示继续按钮', async () => {
    mockUseCloudDataDownload.mockReturnValue({
      ...mockHookReturn,
      isPaused: true
    });

    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /继续/ })).toBeInTheDocument();
    });
  });

  it('应该调用开始下载函数', async () => {
    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      const startButton = screen.getByRole('button', { name: /开始下载/ });
      fireEvent.click(startButton);
      expect(mockHookReturn.startDownload).toHaveBeenCalled();
    });
  });

  it('应该调用刷新数据函数', async () => {
    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      const refreshButton = screen.getByRole('button', { name: /刷新/ });
      fireEvent.click(refreshButton);
      expect(mockHookReturn.refreshData).toHaveBeenCalled();
    });
  });

  it('应该在有失败项目时显示重试按钮', async () => {
    mockUseCloudDataDownload.mockReturnValue({
      ...mockHookReturn,
      downloadStats: {
        ...mockHookReturn.downloadStats,
        failedItems: 1
      }
    });

    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /重试失败项目/ })).toBeInTheDocument();
    });
  });

  it('应该显示下载速度和预计时间', async () => {
    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      expect(screen.getByText(/下载速度:/)).toBeInTheDocument();
      expect(screen.getByText(/预计剩余:/)).toBeInTheDocument();
    });
  });

  it('应该处理错误状态的项目', async () => {
    const errorItem = {
      ...mockHookReturn.downloadItems[0],
      status: 'error' as const,
      error: '网络连接失败'
    };

    mockUseCloudDataDownload.mockReturnValue({
      ...mockHookReturn,
      downloadItems: [errorItem, mockHookReturn.downloadItems[1]]
    });

    render(
      <CloudDataDownloadDialog>
        <button>下载云端数据</button>
      </CloudDataDownloadDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '下载云端数据' }));

    await waitFor(() => {
      expect(screen.getByText('错误: 网络连接失败')).toBeInTheDocument();
    });
  });
});