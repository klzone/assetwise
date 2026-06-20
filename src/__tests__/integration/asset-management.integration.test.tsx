/**
 * 集成测试套件
 * 测试组件间的交互和完整的用户流程
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  TestEnvironment,
  TestAssertions,
  TestDataFactory,
  MockFactory,
} from '@/lib/testing/test-utils';
import userEvent from '@testing-library/user-event';

// Mock组件用于集成测试
const MockAssetForm = ({ onSubmit, onCancel }: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit({
      symbol: formData.get('symbol'),
      name: formData.get('name'),
      type: formData.get('type'),
    });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="asset-form">
      <div>
        <label htmlFor="symbol">资产代码</label>
        <input
          id="symbol"
          name="symbol"
          type="text"
          required
          data-testid="symbol-input"
        />
      </div>
      <div>
        <label htmlFor="name">资产名称</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          data-testid="name-input"
        />
      </div>
      <div>
        <label htmlFor="type">资产类型</label>
        <select id="type" name="type" required data-testid="type-select">
          <option value="">请选择</option>
          <option value="stock">股票</option>
          <option value="fund">基金</option>
          <option value="crypto">加密货币</option>
        </select>
      </div>
      <div>
        <button type="submit" data-testid="submit-button">
          提交
        </button>
        <button type="button" onClick={onCancel} data-testid="cancel-button">
          取消
        </button>
      </div>
    </form>
  );
};

const MockAssetList = ({ 
  assets, 
  onEdit, 
  onDelete, 
  loading = false 
}: {
  assets: any[];
  onEdit: (asset: any) => void;
  onDelete: (assetId: string) => void;
  loading?: boolean;
}) => {
  if (loading) {
    return <div data-testid="loading">加载中...</div>;
  }

  return (
    <div data-testid="asset-list">
      {assets.length === 0 ? (
        <div data-testid="empty-state">暂无资产</div>
      ) : (
        <ul>
          {assets.map((asset) => (
            <li key={asset.id} data-testid={`asset-item-${asset.id}`}>
              <span>{asset.symbol} - {asset.name}</span>
              <button
                onClick={() => onEdit(asset)}
                data-testid={`edit-${asset.id}`}
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(asset.id)}
                data-testid={`delete-${asset.id}`}
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const MockAssetManagementPage = () => {
  const [assets, setAssets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState<any>(null);

  const handleAddAsset = () => {
    setEditingAsset(null);
    setShowForm(true);
  };

  const handleEditAsset = (asset: any) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleDeleteAsset = async (assetId: string) => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 100));
      setAssets(prev => prev.filter(asset => asset.id !== assetId));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAsset = async (data: any) => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (editingAsset) {
        // 更新现有资产
        setAssets(prev => prev.map(asset => 
          asset.id === editingAsset.id 
            ? { ...asset, ...data }
            : asset
        ));
      } else {
        // 添加新资产
        const newAsset = {
          id: Date.now().toString(),
          ...data,
        };
        setAssets(prev => [...prev, newAsset]);
      }
      
      setShowForm(false);
      setEditingAsset(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

  return (
    <div data-testid="asset-management-page">
      <header>
        <h1>资产管理</h1>
        <button
          onClick={handleAddAsset}
          data-testid="add-asset-button"
          disabled={loading}
        >
          添加资产
        </button>
      </header>
      
      <main>
        {showForm ? (
          <MockAssetForm
            onSubmit={handleSubmitAsset}
            onCancel={handleCancelForm}
          />
        ) : (
          <MockAssetList
            assets={assets}
            onEdit={handleEditAsset}
            onDelete={handleDeleteAsset}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
};

describe('资产管理集成测试', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    TestEnvironment.setup();
    user = userEvent.setup();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  describe('完整的资产管理流程', () => {
    it('应该能够添加新资产', async () => {
      render(<MockAssetManagementPage />);

      // 初始状态应该显示空状态
      TestAssertions.expectElementToBeVisible(
        screen.getByTestId('empty-state')
      );

      // 点击添加资产按钮
      const addButton = screen.getByTestId('add-asset-button');
      await user.click(addButton);

      // 应该显示表单
      TestAssertions.expectElementToBeVisible(
        screen.getByTestId('asset-form')
      );

      // 填写表单
      await user.type(screen.getByTestId('symbol-input'), 'AAPL');
      await user.type(screen.getByTestId('name-input'), 'Apple Inc.');
      await user.selectOptions(screen.getByTestId('type-select'), 'stock');

      // 提交表单
      await user.click(screen.getByTestId('submit-button'));

      // 等待加载完成
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // 应该显示新添加的资产
      await waitFor(() => {
        TestAssertions.expectElementToBeVisible(
          screen.getByTestId('asset-item-' + expect.any(String))
        );
      });

      expect(screen.getByText('AAPL - Apple Inc.')).toBeInTheDocument();
    });

    it('应该能够编辑现有资产', async () => {
      render(<MockAssetManagementPage />);

      // 先添加一个资产
      await user.click(screen.getByTestId('add-asset-button'));
      await user.type(screen.getByTestId('symbol-input'), 'MSFT');
      await user.type(screen.getByTestId('name-input'), 'Microsoft');
      await user.selectOptions(screen.getByTestId('type-select'), 'stock');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // 点击编辑按钮
      const editButton = screen.getByTestId(/edit-\d+/);
      await user.click(editButton);

      // 应该显示表单并预填充数据
      TestAssertions.expectElementToBeVisible(
        screen.getByTestId('asset-form')
      );

      // 修改名称
      const nameInput = screen.getByTestId('name-input');
      await user.clear(nameInput);
      await user.type(nameInput, 'Microsoft Corporation');

      // 提交修改
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // 应该显示更新后的名称
      expect(screen.getByText('MSFT - Microsoft Corporation')).toBeInTheDocument();
    });

    it('应该能够删除资产', async () => {
      render(<MockAssetManagementPage />);

      // 先添加一个资产
      await user.click(screen.getByTestId('add-asset-button'));
      await user.type(screen.getByTestId('symbol-input'), 'GOOGL');
      await user.type(screen.getByTestId('name-input'), 'Alphabet Inc.');
      await user.selectOptions(screen.getByTestId('type-select'), 'stock');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // 确认资产存在
      expect(screen.getByText('GOOGL - Alphabet Inc.')).toBeInTheDocument();

      // 点击删除按钮
      const deleteButton = screen.getByTestId(/delete-\d+/);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // 资产应该被删除
      expect(screen.queryByText('GOOGL - Alphabet Inc.')).not.toBeInTheDocument();
      TestAssertions.expectElementToBeVisible(
        screen.getByTestId('empty-state')
      );
    });

    it('应该能够取消表单操作', async () => {
      render(<MockAssetManagementPage />);

      // 点击添加资产
      await user.click(screen.getByTestId('add-asset-button'));

      // 填写部分表单
      await user.type(screen.getByTestId('symbol-input'), 'TSLA');

      // 点击取消
      await user.click(screen.getByTestId('cancel-button'));

      // 应该回到列表视图
      TestAssertions.expectElementToBeVisible(
        screen.getByTestId('asset-list')
      );
      expect(screen.queryByTestId('asset-form')).not.toBeInTheDocument();
    });

    it('应该处理多个资产的管理', async () => {
      render(<MockAssetManagementPage />);

      // 添加多个资产
      const assets = [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
        { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
        { symbol: 'SPY', name: 'SPDR S&P 500', type: 'fund' },
      ];

      for (const asset of assets) {
        await user.click(screen.getByTestId('add-asset-button'));
        await user.type(screen.getByTestId('symbol-input'), asset.symbol);
        await user.type(screen.getByTestId('name-input'), asset.name);
        await user.selectOptions(screen.getByTestId('type-select'), asset.type);
        await user.click(screen.getByTestId('submit-button'));

        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
      }

      // 应该显示所有三个资产
      expect(screen.getByText('AAPL - Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('BTC - Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('SPY - SPDR S&P 500')).toBeInTheDocument();

      // 删除中间的一个资产
      const btcDeleteButton = screen.getByTestId(/delete-\d+/);
      await user.click(btcDeleteButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // 应该只剩下两个资产
      expect(screen.getByText('AAPL - Apple Inc.')).toBeInTheDocument();
      expect(screen.queryByText('BTC - Bitcoin')).not.toBeInTheDocument();
      expect(screen.getByText('SPY - SPDR S&P 500')).toBeInTheDocument();
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理表单验证错误', async () => {
      render(<MockAssetManagementPage />);

      await user.click(screen.getByTestId('add-asset-button'));

      // 尝试提交空表单
      await user.click(screen.getByTestId('submit-button'));

      // 浏览器原生验证应该阻止提交
      // 表单应该仍然可见
      TestAssertions.expectElementToBeVisible(
        screen.getByTestId('asset-form')
      );
    });

    it('应该在加载时禁用操作按钮', async () => {
      render(<MockAssetManagementPage />);

      // 添加一个资产以便测试删除
      await user.click(screen.getByTestId('add-asset-button'));
      await user.type(screen.getByTestId('symbol-input'), 'TEST');
      await user.type(screen.getByTestId('name-input'), 'Test Asset');
      await user.selectOptions(screen.getByTestId('type-select'), 'stock');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // 点击删除按钮
      const deleteButton = screen.getByTestId(/delete-\d+/);
      await user.click(deleteButton);

      // 在加载期间，添加按钮应该被禁用
      const addButton = screen.getByTestId('add-asset-button');
      expect(addButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // 加载完成后，按钮应该重新启用
      expect(addButton).not.toBeDisabled();
    });
  });

  describe('用户体验和可访问性', () => {
    it('应该提供适当的加载状态', async () => {
      render(<MockAssetManagementPage />);

      await user.click(screen.getByTestId('add-asset-button'));
      await user.type(screen.getByTestId('symbol-input'), 'LOAD');
      await user.type(screen.getByTestId('name-input'), 'Loading Test');
      await user.selectOptions(screen.getByTestId('type-select'), 'stock');

      // 提交表单
      await user.click(screen.getByTestId('submit-button'));

      // 应该短暂显示加载状态
      TestAssertions.expectLoadingState(screen.getByTestId('asset-management-page'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
    });

    it('应该支持键盘导航', async () => {
      render(<MockAssetManagementPage />);

      // 使用Tab键导航到添加按钮
      await user.tab();
      expect(screen.getByTestId('add-asset-button')).toHaveFocus();

      // 按Enter键应该触发点击
      await user.keyboard('{Enter}');
      TestAssertions.expectElementToBeVisible(
        screen.getByTestId('asset-form')
      );
    });

    it('应该提供适当的焦点管理', async () => {
      render(<MockAssetManagementPage />);

      await user.click(screen.getByTestId('add-asset-button'));

      // 表单打开后，第一个输入框应该获得焦点
      expect(screen.getByTestId('symbol-input')).toHaveFocus();

      // 点击取消后，焦点应该回到添加按钮
      await user.click(screen.getByTestId('cancel-button'));
      expect(screen.getByTestId('add-asset-button')).toHaveFocus();
    });
  });
});

describe('数据流和状态管理集成测试', () => {
  beforeEach(() => {
    TestEnvironment.setup();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该正确维护组件间的状态同步', () => {
    let sharedState = { count: 0 };

    const ComponentA = () => {
      const [count, setCount] = React.useState(sharedState.count);
      
      React.useEffect(() => {
        sharedState.count = count;
      }, [count]);

      return (
        <div>
          <span data-testid="count-a">{count}</span>
          <button
            data-testid="increment-a"
            onClick={() => setCount(c => c + 1)}
          >
            +
          </button>
        </div>
      );
    };

    const ComponentB = () => {
      const [count, setCount] = React.useState(sharedState.count);
      
      React.useEffect(() => {
        const interval = setInterval(() => {
          setCount(sharedState.count);
        }, 100);
        return () => clearInterval(interval);
      }, []);

      return (
        <div>
          <span data-testid="count-b">{count}</span>
        </div>
      );
    };

    const App = () => (
      <div>
        <ComponentA />
        <ComponentB />
      </div>
    );

    render(<App />);

    // 初始状态
    expect(screen.getByTestId('count-a')).toHaveTextContent('0');
    expect(screen.getByTestId('count-b')).toHaveTextContent('0');

    // 在ComponentA中增加计数
    fireEvent.click(screen.getByTestId('increment-a'));

    expect(screen.getByTestId('count-a')).toHaveTextContent('1');
    
    // ComponentB应该在下一个更新周期中同步
    waitFor(() => {
      expect(screen.getByTestId('count-b')).toHaveTextContent('1');
    });
  });
});

describe('API集成测试', () => {
  beforeEach(() => {
    TestEnvironment.setup();
    
    // Mock API响应
    global.fetch = MockFactory.createMockFn()
      .mockResolvedValueOnce(MockFactory.createMockFetchResponse([
        TestDataFactory.createAsset({ id: '1', symbol: 'AAPL', name: 'Apple Inc.' }),
        TestDataFactory.createAsset({ id: '2', symbol: 'MSFT', name: 'Microsoft' }),
      ]))
      .mockResolvedValueOnce(MockFactory.createMockFetchResponse(
        TestDataFactory.createAsset({ id: '3', symbol: 'GOOGL', name: 'Alphabet' })
      ))
      .mockResolvedValueOnce(MockFactory.createMockFetchResponse({ success: true }));
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该正确处理API数据流', async () => {
    const ApiIntegratedComponent = () => {
      const [assets, setAssets] = React.useState<any[]>([]);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        const fetchAssets = async () => {
          try {
            const response = await fetch('/api/assets');
            const data = await response.json();
            setAssets(data);
          } finally {
            setLoading(false);
          }
        };

        fetchAssets();
      }, []);

      const addAsset = async (assetData: any) => {
        setLoading(true);
        try {
          const response = await fetch('/api/assets', {
            method: 'POST',
            body: JSON.stringify(assetData),
          });
          const newAsset = await response.json();
          setAssets(prev => [...prev, newAsset]);
        } finally {
          setLoading(false);
        }
      };

      const deleteAsset = async (assetId: string) => {
        setLoading(true);
        try {
          await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
          setAssets(prev => prev.filter(asset => asset.id !== assetId));
        } finally {
          setLoading(false);
        }
      };

      if (loading) {
        return <div data-testid="loading">加载中...</div>;
      }

      return (
        <div>
          <div data-testid="asset-count">{assets.length}</div>
          {assets.map(asset => (
            <div key={asset.id} data-testid={`asset-${asset.id}`}>
              {asset.symbol} - {asset.name}
              <button onClick={() => deleteAsset(asset.id)}>删除</button>
            </div>
          ))}
          <button onClick={() => addAsset({ symbol: 'GOOGL', name: 'Alphabet' })}>
            添加资产
          </button>
        </div>
      );
    };

    render(<ApiIntegratedComponent />);

    // 等待初始加载完成
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // 应该显示初始资产
    expect(screen.getByTestId('asset-count')).toHaveTextContent('2');
    expect(screen.getByTestId('asset-1')).toHaveTextContent('AAPL - Apple Inc.');
    expect(screen.getByTestId('asset-2')).toHaveTextContent('MSFT - Microsoft');

    // 添加新资产
    await userEvent.click(screen.getByText('添加资产'));

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('asset-count')).toHaveTextContent('3');
    expect(screen.getByTestId('asset-3')).toHaveTextContent('GOOGL - Alphabet');

    // 验证API调用
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/assets');
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/assets', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'GOOGL', name: 'Alphabet' }),
    });
  });
});