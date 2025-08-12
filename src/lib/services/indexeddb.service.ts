import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { User, Asset, Transaction, Account } from '@/lib/types/data.types';
import { Portfolio, PortfolioAsset } from '@/lib/types/portfolio.types';

// 定义数据库结构
interface AssetWiseDB extends DBSchema {
  users: {
    key: string;
    value: User & { synced: boolean; last_modified: string };
  };
  accounts: {
    key: string;
    value: Account & { synced: boolean; last_modified: string };
    indexes: { 'by-user': string };
  };
  assets: {
    key: string;
    value: Asset & { synced: boolean; last_modified: string };
    indexes: { 'by-user': string; 'by-symbol': string };
  };
  transactions: {
    key: string;
    value: Transaction & { synced: boolean; last_modified: string };
    indexes: { 'by-user': string; 'by-account': string; 'by-date': string };
  };
  portfolios: {
    key: string;
    value: Portfolio & { synced: boolean; last_modified: string };
    indexes: { 'by-user': string };
  };
  portfolio_assets: {
    key: string;
    value: PortfolioAsset & { synced: boolean; last_modified: string };
    indexes: { 'by-portfolio': string };
  };
  sync_metadata: {
    key: string;
    value: {
      table_name: string;
      last_sync: string;
      sync_token: string;
      pending_changes: number;
    };
  };
  offline_queue: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      table_name: string;
      data: any;
      timestamp: string;
      retry_count: number;
    };
  };
}

class IndexedDBService {
  private db: IDBPDatabase<AssetWiseDB> | null = null;
  private readonly DB_NAME = 'AssetWiseDB';
  private readonly DB_VERSION = 1;

  // 初始化数据库
  async initialize(): Promise<void> {
    try {
      this.db = await openDB<AssetWiseDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`数据库升级: ${oldVersion} -> ${newVersion}`);

          // 用户表
          if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id' });
            userStore.createIndex('by-email', 'email', { unique: true });
          }

          // 账户表
          if (!db.objectStoreNames.contains('accounts')) {
            const accountStore = db.createObjectStore('accounts', { keyPath: 'id' });
            accountStore.createIndex('by-user', 'user_id');
          }

          // 资产表
          if (!db.objectStoreNames.contains('assets')) {
            const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
            assetStore.createIndex('by-user', 'user_id');
            assetStore.createIndex('by-symbol', 'symbol');
          }

          // 交易记录表
          if (!db.objectStoreNames.contains('transactions')) {
            const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
            transactionStore.createIndex('by-user', 'user_id');
            transactionStore.createIndex('by-account', 'account_id');
            transactionStore.createIndex('by-date', 'date');
          }

          // 投资组合表
          if (!db.objectStoreNames.contains('portfolios')) {
            const portfolioStore = db.createObjectStore('portfolios', { keyPath: 'id' });
            portfolioStore.createIndex('by-user', 'user_id');
          }

          // 投资组合资产表
          if (!db.objectStoreNames.contains('portfolio_assets')) {
            const portfolioAssetStore = db.createObjectStore('portfolio_assets', { keyPath: 'id' });
            portfolioAssetStore.createIndex('by-portfolio', 'portfolio_id');
          }

          // 同步元数据表
          if (!db.objectStoreNames.contains('sync_metadata')) {
            db.createObjectStore('sync_metadata', { keyPath: 'table_name' });
          }

          // 离线操作队列表
          if (!db.objectStoreNames.contains('offline_queue')) {
            const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' });
            queueStore.createIndex('by-timestamp', 'timestamp');
          }
        },
        blocked() {
          console.warn('数据库被阻塞，请关闭其他标签页');
        },
        blocking() {
          console.warn('数据库正在阻塞其他连接');
        }
      });

      console.log('✅ IndexedDB 初始化成功');
    } catch (error) {
      console.error('❌ IndexedDB 初始化失败:', error);
      throw error;
    }
  }

  // 确保数据库已初始化
  private async ensureDB(): Promise<IDBPDatabase<AssetWiseDB>> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('数据库初始化失败');
    }
    return this.db;
  }

  // 通用的CRUD操作
  async create<T extends keyof AssetWiseDB>(
    storeName: T,
    data: AssetWiseDB[T]['value']
  ): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction(storeName, 'readwrite');
    
    // 添加同步标记
    const dataWithSync = {
      ...data,
      synced: false,
      last_modified: new Date().toISOString()
    };

    await tx.objectStore(storeName).add(dataWithSync);
    await tx.done;

    // 添加到离线队列
    await this.addToOfflineQueue('create', storeName as string, dataWithSync);
  }

  async read<T extends keyof AssetWiseDB>(
    storeName: T,
    key: AssetWiseDB[T]['key']
  ): Promise<AssetWiseDB[T]['value'] | undefined> {
    const db = await this.ensureDB();
    return await db.get(storeName, key);
  }

  async readAll<T extends keyof AssetWiseDB>(
    storeName: T
  ): Promise<AssetWiseDB[T]['value'][]> {
    const db = await this.ensureDB();
    return await db.getAll(storeName);
  }

  async update<T extends keyof AssetWiseDB>(
    storeName: T,
    data: AssetWiseDB[T]['value']
  ): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction(storeName, 'readwrite');
    
    // 更新同步标记
    const dataWithSync = {
      ...data,
      synced: false,
      last_modified: new Date().toISOString()
    };

    await tx.objectStore(storeName).put(dataWithSync);
    await tx.done;

    // 添加到离线队列
    await this.addToOfflineQueue('update', storeName as string, dataWithSync);
  }

  async delete<T extends keyof AssetWiseDB>(
    storeName: T,
    key: AssetWiseDB[T]['key']
  ): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction(storeName, 'readwrite');
    
    // 先获取要删除的数据
    const existingData = await tx.objectStore(storeName).get(key);
    if (existingData) {
      await tx.objectStore(storeName).delete(key);
      await tx.done;

      // 添加到离线队列
      await this.addToOfflineQueue('delete', storeName as string, { id: key });
    }
  }

  // 按索引查询
  async getByIndex<T extends keyof AssetWiseDB>(
    storeName: T,
    indexName: string,
    key: IDBValidKey
  ): Promise<AssetWiseDB[T]['value'][]> {
    const db = await this.ensureDB();
    const tx = db.transaction(storeName, 'readonly');
    const index = tx.objectStore(storeName).index(indexName);
    return await index.getAll(key);
  }

  // 批量操作
  async batchCreate<T extends keyof AssetWiseDB>(
    storeName: T,
    dataArray: AssetWiseDB[T]['value'][]
  ): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    for (const data of dataArray) {
      const dataWithSync = {
        ...data,
        synced: false,
        last_modified: new Date().toISOString()
      };
      await store.add(dataWithSync);
    }

    await tx.done;
  }

  async batchUpdate<T extends keyof AssetWiseDB>(
    storeName: T,
    dataArray: AssetWiseDB[T]['value'][]
  ): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    for (const data of dataArray) {
      const dataWithSync = {
        ...data,
        synced: true, // 批量更新通常来自服务器同步
        last_modified: new Date().toISOString()
      };
      await store.put(dataWithSync);
    }

    await tx.done;
  }

  // 离线队列管理
  private async addToOfflineQueue(
    operation: 'create' | 'update' | 'delete',
    tableName: string,
    data: any
  ): Promise<void> {
    const db = await this.ensureDB();
    const queueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      table_name: tableName,
      data,
      timestamp: new Date().toISOString(),
      retry_count: 0
    };

    await db.add('offline_queue', queueItem);
  }

  async getOfflineQueue(): Promise<AssetWiseDB['offline_queue']['value'][]> {
    const db = await this.ensureDB();
    return await db.getAll('offline_queue');
  }

  async removeFromOfflineQueue(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('offline_queue', id);
  }

  async incrementRetryCount(id: string): Promise<void> {
    const db = await this.ensureDB();
    const item = await db.get('offline_queue', id);
    if (item) {
      item.retry_count += 1;
      await db.put('offline_queue', item);
    }
  }

  // 同步元数据管理
  async getSyncMetadata(tableName: string): Promise<AssetWiseDB['sync_metadata']['value'] | undefined> {
    const db = await this.ensureDB();
    return await db.get('sync_metadata', tableName);
  }

  async updateSyncMetadata(
    tableName: string,
    lastSync: string,
    syncToken: string,
    pendingChanges: number = 0
  ): Promise<void> {
    const db = await this.ensureDB();
    const metadata = {
      table_name: tableName,
      last_sync: lastSync,
      sync_token: syncToken,
      pending_changes: pendingChanges
    };
    await db.put('sync_metadata', metadata);
  }

  // 获取未同步的数据
  async getUnsyncedData<T extends keyof AssetWiseDB>(
    storeName: T
  ): Promise<AssetWiseDB[T]['value'][]> {
    const db = await this.ensureDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const cursor = await store.openCursor();
    const unsyncedData: AssetWiseDB[T]['value'][] = [];

    if (cursor) {
      do {
        const data = cursor.value as any;
        if (!data.synced) {
          unsyncedData.push(data);
        }
      } while (await cursor.continue());
    }

    return unsyncedData;
  }

  // 标记数据为已同步
  async markAsSynced<T extends keyof AssetWiseDB>(
    storeName: T,
    key: AssetWiseDB[T]['key']
  ): Promise<void> {
    const db = await this.ensureDB();
    const data = await db.get(storeName, key);
    if (data) {
      const syncedData = { ...data, synced: true } as any;
      await db.put(storeName, syncedData);
    }
  }

  // 清理过期数据
  async cleanupExpiredData(daysToKeep: number = 30): Promise<void> {
    const db = await this.ensureDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();

    // 清理过期的离线队列项
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const index = store.index('by-timestamp');
    const cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffISO));

    if (cursor) {
      do {
        const item = cursor.value;
        // 只删除重试次数过多的项目
        if (item.retry_count > 5) {
          await cursor.delete();
        }
      } while (await cursor.continue());
    }

    await tx.done;
    console.log('✅ 过期数据清理完成');
  }

  // 获取数据库统计信息
  async getStorageStats(): Promise<{
    totalSize: number;
    tableStats: Record<string, number>;
    unsyncedCount: number;
    queueSize: number;
  }> {
    const db = await this.ensureDB();
    const stats = {
      totalSize: 0,
      tableStats: {} as Record<string, number>,
      unsyncedCount: 0,
      queueSize: 0
    };

    // 统计各表数据量
    const storeNames: (keyof AssetWiseDB)[] = [
      'users', 'accounts', 'assets', 'transactions', 
      'portfolios', 'portfolio_assets', 'sync_metadata', 'offline_queue'
    ];

    for (const storeName of storeNames) {
      const count = await db.count(storeName);
      stats.tableStats[storeName] = count;
      stats.totalSize += count;
    }

    // 统计未同步数据
    for (const storeName of ['users', 'accounts', 'assets', 'transactions', 'portfolios', 'portfolio_assets'] as const) {
      const unsyncedData = await this.getUnsyncedData(storeName);
      stats.unsyncedCount += unsyncedData.length;
    }

    // 统计队列大小
    stats.queueSize = await db.count('offline_queue');

    return stats;
  }

  // 导出数据
  async exportData(): Promise<{
    users: User[];
    accounts: Account[];
    assets: Asset[];
    transactions: Transaction[];
    portfolios: Portfolio[];
    portfolio_assets: PortfolioAsset[];
    export_date: string;
  }> {
    const db = await this.ensureDB();
    
    const [users, accounts, assets, transactions, portfolios, portfolioAssets] = await Promise.all([
      db.getAll('users'),
      db.getAll('accounts'),
      db.getAll('assets'),
      db.getAll('transactions'),
      db.getAll('portfolios'),
      db.getAll('portfolio_assets')
    ]);

    // 移除同步标记字段
    const cleanData = (data: any[]) => data.map(item => {
      const { synced, last_modified, ...cleanItem } = item;
      return cleanItem;
    });

    return {
      users: cleanData(users),
      accounts: cleanData(accounts),
      assets: cleanData(assets),
      transactions: cleanData(transactions),
      portfolios: cleanData(portfolios),
      portfolio_assets: cleanData(portfolioAssets),
      export_date: new Date().toISOString()
    };
  }

  // 导入数据
  async importData(data: {
    users?: User[];
    accounts?: Account[];
    assets?: Asset[];
    transactions?: Transaction[];
    portfolios?: Portfolio[];
    portfolio_assets?: PortfolioAsset[];
  }): Promise<void> {
    const db = await this.ensureDB();

    // 批量导入各类数据
    if (data.users?.length) {
      await this.batchUpdate('users', data.users as any);
    }
    if (data.accounts?.length) {
      await this.batchUpdate('accounts', data.accounts as any);
    }
    if (data.assets?.length) {
      await this.batchUpdate('assets', data.assets as any);
    }
    if (data.transactions?.length) {
      await this.batchUpdate('transactions', data.transactions as any);
    }
    if (data.portfolios?.length) {
      await this.batchUpdate('portfolios', data.portfolios as any);
    }
    if (data.portfolio_assets?.length) {
      await this.batchUpdate('portfolio_assets', data.portfolio_assets as any);
    }

    console.log('✅ 数据导入完成');
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames: (keyof AssetWiseDB)[] = [
      'users', 'accounts', 'assets', 'transactions', 
      'portfolios', 'portfolio_assets', 'sync_metadata', 'offline_queue'
    ];

    const tx = db.transaction(storeNames, 'readwrite');
    
    for (const storeName of storeNames) {
      await tx.objectStore(storeName).clear();
    }

    await tx.done;
    console.log('✅ 所有数据已清空');
  }

  // 关闭数据库连接
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✅ 数据库连接已关闭');
    }
  }
}

// 创建单例实例
export const indexedDBService = new IndexedDBService();

// 自动初始化
if (typeof window !== 'undefined') {
  indexedDBService.initialize().catch(console.error);
}