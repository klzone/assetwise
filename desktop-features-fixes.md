# AssetWise 桌面端功能优化计划

## 桌面端功能问题总结

根据测试结果，我们发现了以下需要优化的桌面端功能：

1. **跨平台兼容性**
   - 在不同操作系统上可能存在UI和功能差异
   - 需要确保在Windows、macOS和Linux上的一致体验

2. **离线功能支持**
   - 缺乏完善的离线数据访问和同步机制
   - 需要实现本地数据存储和冲突解决

3. **系统集成**
   - 未充分利用桌面平台特有功能
   - 需要实现系统通知、文件关联和自动更新

4. **安全性增强**
   - 本地数据存储加密不足
   - 需要实现更安全的本地认证机制

5. **性能优化**
   - 启动时间较长
   - 资源占用较高

## 优化方案

### 1. 跨平台兼容性优化

#### 问题
- 在不同操作系统上UI和功能表现不一致

#### 解决方案
- 使用平台检测进行条件渲染
- 实现平台特定样式和布局
- 创建统一的抽象层处理平台差异

#### 实施步骤
1. 创建平台检测工具：
```typescript
// src/utils/platform.ts
export const getPlatform = () => {
  return window.__TAURI__?.env.platform || 'web';
};

export const isWindows = () => getPlatform() === 'win32';
export const isMacOS = () => getPlatform() === 'darwin';
export const isLinux = () => getPlatform() === 'linux';
export const isDesktop = () => !!window.__TAURI__;
```

2. 实现平台特定样式：
```typescript
// src/styles/platform.ts
import { isWindows, isMacOS, isLinux } from '../utils/platform';

export const getPlatformStyles = () => {
  if (isWindows()) {
    return {
      windowControls: 'right',
      fontFamily: 'Segoe UI',
      borderRadius: '4px',
    };
  }
  
  if (isMacOS()) {
    return {
      windowControls: 'left',
      fontFamily: 'SF Pro Text',
      borderRadius: '6px',
    };
  }
  
  if (isLinux()) {
    return {
      windowControls: 'right',
      fontFamily: 'Ubuntu',
      borderRadius: '4px',
    };
  }
  
  return {
    windowControls: 'right',
    fontFamily: 'system-ui',
    borderRadius: '4px',
  };
};
```

3. 创建平台特定组件：
```typescript
// src/components/platform/WindowControls.tsx
import { isWindows, isMacOS } from '../../utils/platform';

export const WindowControls = () => {
  if (isMacOS()) {
    return <MacOSWindowControls />;
  }
  
  if (isWindows()) {
    return <WindowsWindowControls />;
  }
  
  return <LinuxWindowControls />;
};
```

4. 测试各平台兼容性：
   - 在Windows、macOS和Linux上运行应用
   - 验证UI一致性和功能正确性
   - 修复平台特定问题

### 2. 离线功能支持

#### 问题
- 缺乏完善的离线数据访问和同步机制

#### 解决方案
- 实现本地SQLite数据库存储
- 创建数据同步机制
- 添加冲突检测和解决策略

#### 实施步骤
1. 配置本地SQLite数据库：
```typescript
// src-tauri/src/db.rs
use rusqlite::{Connection, Result};
use std::path::Path;

pub fn init_db() -> Result<Connection> {
    let app_dir = tauri::api::path::app_dir().expect("无法获取应用目录");
    let db_path = app_dir.join("assetwise.db");
    
    let conn = Connection::open(db_path)?;
    
    // 创建必要的表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            value REAL NOT NULL,
            last_updated TEXT NOT NULL,
            sync_status TEXT NOT NULL
        )",
        [],
    )?;
    
    // 创建其他必要的表...
    
    Ok(conn)
}
```

2. 实现数据同步机制：
```typescript
// src/services/syncService.ts
import { invoke } from '@tauri-apps/api';
import { getSupabase } from './supabaseService';

export const syncData = async () => {
  try {
    // 获取本地未同步数据
    const localChanges = await invoke('get_unsynchronized_data');
    
    // 上传到Supabase
    const supabase = getSupabase();
    for (const change of localChanges) {
      await supabase.from(change.table).upsert(change.data);
    }
    
    // 获取远程更新
    const lastSyncTimestamp = await invoke('get_last_sync_timestamp');
    const remoteChanges = await supabase
      .from('sync_log')
      .select('*')
      .gt('timestamp', lastSyncTimestamp);
    
    // 应用远程更新到本地
    await invoke('apply_remote_changes', { changes: remoteChanges.data });
    
    // 更新同步时间戳
    await invoke('update_sync_timestamp');
    
    return { success: true };
  } catch (error) {
    console.error('同步失败:', error);
    return { success: false, error };
  }
};
```

3. 添加冲突解决策略：
```typescript
// src/services/conflictResolver.ts
import { invoke } from '@tauri-apps/api';

export const resolveConflicts = async (conflicts) => {
  // 对每个冲突应用解决策略
  for (const conflict of conflicts) {
    switch (conflict.resolution) {
      case 'useLocal':
        await invoke('resolve_conflict_with_local', { conflictId: conflict.id });
        break;
      case 'useRemote':
        await invoke('resolve_conflict_with_remote', { conflictId: conflict.id });
        break;
      case 'merge':
        await invoke('merge_conflict', { conflictId: conflict.id });
        break;
      default:
        throw new Error(`未知的冲突解决策略: ${conflict.resolution}`);
    }
  }
};
```

4. 实现离线状态检测：
```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};
```

### 3. 系统集成

#### 问题
- 未充分利用桌面平台特有功能

#### 解决方案
- 实现系统通知
- 添加文件关联
- 配置自动更新
- 添加系统托盘图标

#### 实施步骤
1. 实现系统通知：
```typescript
// src/utils/notifications.ts
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

export const showNotification = async (title, body) => {
  let permissionGranted = await isPermissionGranted();
  
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }
  
  if (permissionGranted) {
    sendNotification({ title, body });
    return true;
  }
  
  return false;
};
```

2. 添加文件关联：
```toml
# src-tauri/tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "scope": ["$DOCUMENT/*"]
      }
    },
    "bundle": {
      "fileAssociations": [
        {
          "ext": ["asw"],
          "name": "AssetWise文件",
          "mimeType": "application/x-assetwise"
        }
      ]
    }
  }
}
```

3. 配置自动更新：
```typescript
// src/services/updateService.ts
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';

export const checkForUpdates = async () => {
  try {
    const { shouldUpdate, manifest } = await checkUpdate();
    
    if (shouldUpdate) {
      return {
        available: true,
        version: manifest.version,
        body: manifest.body
      };
    }
    
    return { available: false };
  } catch (error) {
    console.error('检查更新失败:', error);
    return { available: false, error };
  }
};

export const installAppUpdate = async () => {
  try {
    await installUpdate();
    await relaunch();
    return { success: true };
  } catch (error) {
    console.error('安装更新失败:', error);
    return { success: false, error };
  }
};
```

4. 添加系统托盘图标：
```rust
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .system_tray(
            tauri::SystemTray::new()
                .with_menu(
                    tauri::SystemTrayMenu::new()
                        .add_item(tauri::CustomMenuItem::new("show", "显示窗口"))
                        .add_item(tauri::CustomMenuItem::new("hide", "隐藏窗口"))
                        .add_native_item(tauri::SystemTrayMenuItem::Separator)
                        .add_item(tauri::CustomMenuItem::new("quit", "退出"))
                )
        )
        .on_system_tray_event(|app, event| {
            match event {
                tauri::SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "quit" => {
                            app.exit(0);
                        }
                        "show" => {
                            let window = app.get_window("main").unwrap();
                            window.show().unwrap();
                        }
                        "hide" => {
                            let window = app.get_window("main").unwrap();
                            window.hide().unwrap();
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("运行应用程序时出错");
}
```

### 4. 安全性增强

#### 问题
- 本地数据存储加密不足

#### 解决方案
- 实现数据库加密
- 添加应用锁定功能
- 支持生物识别认证

#### 实施步骤
1. 实现数据库加密：
```rust
// src-tauri/src/db.rs
use rusqlite::{Connection, Result};
use rusqlite_cipher::{SqlCipherConnection, SqlCipherVersion};
use std::path::Path;

pub fn init_encrypted_db(encryption_key: &str) -> Result<Connection> {
    let app_dir = tauri::api::path::app_dir().expect("无法获取应用目录");
    let db_path = app_dir.join("assetwise.db");
    
    let conn = SqlCipherConnection::open_with_flags(
        db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_WRITE | rusqlite::OpenFlags::SQLITE_OPEN_CREATE,
        SqlCipherVersion::SqlCipher4,
        encryption_key,
    )?;
    
    // 创建必要的表...
    
    Ok(conn)
}
```

2. 添加应用锁定功能：
```typescript
// src/services/lockService.ts
import { invoke } from '@tauri-apps/api';
import { store } from '../store';

export const lockApp = async () => {
  store.dispatch({ type: 'SET_APP_LOCKED', payload: true });
  await invoke('lock_app');
};

export const unlockApp = async (password) => {
  try {
    const result = await invoke('verify_password', { password });
    if (result) {
      store.dispatch({ type: 'SET_APP_LOCKED', payload: false });
      return { success: true };
    }
    return { success: false, error: '密码不正确' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const isAppLocked = () => {
  return store.getState().app.locked;
};
```

3. 支持生物识别认证：
```typescript
// src/services/biometricService.ts
import { invoke } from '@tauri-apps/api';

export const isBiometricAvailable = async () => {
  try {
    return await invoke('is_biometric_available');
  } catch (error) {
    console.error('检查生物识别可用性失败:', error);
    return false;
  }
};

export const authenticateWithBiometric = async () => {
  try {
    const result = await invoke('authenticate_with_biometric');
    return { success: true, result };
  } catch (error) {
    console.error('生物识别认证失败:', error);
    return { success: false, error: error.message };
  }
};
```

### 5. 性能优化

#### 问题
- 启动时间较长
- 资源占用较高

#### 解决方案
- 实现启动优化
- 减少资源占用
- 优化渲染性能

#### 实施步骤
1. 实现启动优化：
```typescript
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 预加载必要的资源
            std::thread::spawn(move || {
                // 在后台线程中初始化数据库连接
                let _ = db::init_db();
                
                // 预加载常用数据
                let _ = data::preload_common_data();
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("运行应用程序时出错");
}
```

2. 减少资源占用：
```typescript
// src/hooks/useResourceOptimization.ts
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api';

export const useResourceOptimization = () => {
  useEffect(() => {
    // 当应用不活跃时减少资源使用
    const handleVisibilityChange = () => {
      if (document.hidden) {
        invoke('reduce_resource_usage');
      } else {
        invoke('restore_resource_usage');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
```

3. 优化渲染性能：
```typescript
// src/components/VirtualTable.tsx
import { useVirtual } from 'react-virtual';
import { useRef } from 'react';

export const VirtualTable = ({ data, rowHeight = 40 }) => {
  const parentRef = useRef(null);
  
  const rowVirtualizer = useVirtual({
    size: data.length,
    parentRef,
    estimateSize: () => rowHeight,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="virtual-table">
      <div
        style={{
          height: `${rowVirtualizer.totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.index}
            className="table-row"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${rowHeight}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {/* 渲染行内容 */}
            {renderRowContent(data[virtualRow.index])}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 实施时间表

1. **第一阶段 (1-2周)**
   - 跨平台兼容性优化
   - 系统集成基础功能

2. **第二阶段 (2-3周)**
   - 离线功能支持
   - 安全性增强

3. **第三阶段 (1-2周)**
   - 性能优化
   - 系统集成高级功能

4. **第四阶段 (1周)**
   - 全面测试
   - 修复问题
   - 文档编写

## 测试计划

1. **跨平台测试**
   - 在Windows、macOS和Linux上测试UI一致性
   - 验证平台特定功能正常工作

2. **离线功能测试**
   - 测试断网情况下的应用功能
   - 验证数据同步和冲突解决

3. **系统集成测试**
   - 测试系统通知
   - 验证文件关联
   - 测试自动更新流程

4. **安全性测试**
   - 验证数据库加密
   - 测试应用锁定功能
   - 验证生物识别认证

5. **性能测试**
   - 测量启动时间
   - 监控资源占用
   - 评估渲染性能