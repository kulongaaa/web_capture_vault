import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { startServer, stopServer } from '../server/index';

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private serverPort = 3001;

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // 应用准备就绪时创建窗口
    app.whenReady().then(() => {
      this.createMainWindow();
      this.startLocalServer();
      this.setupMenu();
      
      // macOS 特定：当所有窗口关闭时不退出应用
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    // 所有窗口关闭时退出应用（除了 macOS）
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
        app.quit();
      }
    });

    // 应用退出前清理
    app.on('before-quit', () => {
      this.cleanup();
    });

    this.setupIpcHandlers();
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'), // 更新路径
      },
      titleBarStyle: 'hiddenInset',
      icon: path.join(__dirname, '../../assets/icon.png'), // 可选
    });

    // 加载渲染进程
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // 窗口状态管理
    this.setupWindowStateManagement();
  }

  private setupWindowStateManagement(): void {
    if (!this.mainWindow) return;

    // 可以在这里添加窗口状态保存和恢复逻辑
    this.mainWindow.on('resize', () => {
      // 保存窗口大小
    });

    this.mainWindow.on('move', () => {
      // 保存窗口位置
    });
  }

  private async startLocalServer(): Promise<void> {
    try {
      await startServer(this.serverPort);
      console.log(`本地服务器已启动，端口: ${this.serverPort}`);
      
      // 通知渲染进程服务器状态
      if (this.mainWindow) {
        this.mainWindow.webContents.send('server-status', {
          running: true,
          port: this.serverPort,
        });
      }
    } catch (error) {
      console.error('启动本地服务器失败:', error);
      
      // 通知渲染进程错误状态
      if (this.mainWindow) {
        this.mainWindow.webContents.send('server-status', {
          running: false,
          error: (error as any).message,
        });
      }
    }
  }

  private setupIpcHandlers(): void {
    // 获取服务器状态
    ipcMain.handle('get-server-status', () => {
      return {
        running: true, // 这里应该检查实际服务器状态
        port: this.serverPort,
        version: app.getVersion(),
      };
    });

    // 重启服务器
    ipcMain.handle('restart-server', async () => {
      try {
        await stopServer();
        await startServer(this.serverPort);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as any).message };
      }
    });

    // 获取应用信息
    ipcMain.handle('get-app-info', () => {
      return {
        name: app.getName(),
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
      };
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Note',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-action', 'new-note');
            },
          },
          {
            label: 'New Folder',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-action', 'new-folder');
            },
          },
          { type: 'separator' },
          {
            label: 'Import',
            click: () => {
              this.mainWindow?.webContents.send('menu-action', 'import');
            },
          },
          {
            label: 'Export',
            click: () => {
              this.mainWindow?.webContents.send('menu-action', 'export');
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
        ],
      },
    ];

    // macOS 特定菜单调整
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private cleanup(): void {
    stopServer();
  }
}

// 启动应用
new ElectronApp();