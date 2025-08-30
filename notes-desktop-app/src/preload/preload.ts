import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取服务器状态
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  
  // 重启服务器
  restartServer: () => ipcRenderer.invoke('restart-server'),
  
  // 获取应用信息
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // 监听菜单操作
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_event, action) => callback(action));
  },
  
  // 监听服务器状态变化
  onServerStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('server-status', (_event, status) => callback(status));
  },
  
  // 移除监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// 为TypeScript提供类型定义
declare global {
  interface Window {
    electronAPI: {
      getServerStatus: () => Promise<any>;
      restartServer: () => Promise<any>;
      getAppInfo: () => Promise<any>;
      onMenuAction: (callback: (action: string) => void) => void;
      onServerStatus: (callback: (status: any) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}