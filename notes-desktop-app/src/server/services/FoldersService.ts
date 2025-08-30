import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Folder, CreateFolderRequest } from '../../types';

/**
 * 文件夹服务类 - 负责文件夹的管理
 */
export class FoldersService {
  private dataDir: string;
  private foldersFile: string;
  private folders: Map<string, Folder> = new Map();

  constructor() {
    // 获取用户数据目录
    this.dataDir = this.getDataDirectory();
    this.foldersFile = path.join(this.dataDir, 'folders.json');
    this.initializeData();
  }

  /**
   * 获取数据存储目录
   */
  private getDataDirectory(): string {
    const os = require('os');
    const appName = 'NotesDesktopApp';
    
    let dataDir: string;
    
    if (process.platform === 'win32') {
      dataDir = path.join(os.homedir(), 'AppData', 'Roaming', appName);
    } else if (process.platform === 'darwin') {
      dataDir = path.join(os.homedir(), 'Library', 'Application Support', appName);
    } else {
      dataDir = path.join(os.homedir(), '.config', appName);
    }
    
    return dataDir;
  }

  /**
   * 初始化数据
   */
  private async initializeData(): Promise<void> {
    try {
      // 确保数据目录存在
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // 加载现有文件夹
      await this.loadFolders();
    } catch (error) {
      console.error('初始化文件夹数据失败:', error);
      throw error;
    }
  }

  /**
   * 从文件加载文件夹
   */
  private async loadFolders(): Promise<void> {
    try {
      const data = await fs.readFile(this.foldersFile, 'utf-8');
      const foldersArray: Folder[] = JSON.parse(data);
      
      this.folders.clear();
      foldersArray.forEach(folder => {
        this.folders.set(folder.id, folder);
      });
      
      console.log(`已加载 ${this.folders.size} 个文件夹`);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // 文件不存在，创建默认文件夹结构
        await this.createDefaultFolders();
        console.log('创建默认文件夹结构');
      } else {
        console.error('加载文件夹失败:', error);
        throw error;
      }
    }
  }

  /**
   * 创建默认文件夹结构
   */
  private async createDefaultFolders(): Promise<void> {
    const now = Date.now();
    
    const defaultFolders: Folder[] = [
      {
        id: 'inbox',
        name: '收件箱',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'archive',
        name: '归档',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'favorites',
        name: '收藏',
        createdAt: now,
        updatedAt: now
      }
    ];

    defaultFolders.forEach(folder => {
      this.folders.set(folder.id, folder);
    });

    await this.saveFolders();
  }

  /**
   * 保存文件夹到文件
   */
  private async saveFolders(): Promise<void> {
    try {
      const foldersArray = Array.from(this.folders.values());
      await fs.writeFile(this.foldersFile, JSON.stringify(foldersArray, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存文件夹失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件夹树结构
   */
  public async getFolders(): Promise<Folder[]> {
    const folders = Array.from(this.folders.values());
    
    // 按创建时间排序
    folders.sort((a, b) => a.createdAt - b.createdAt);
    
    return this.buildFolderTree(folders);
  }

  /**
   * 构建文件夹树结构
   */
  private buildFolderTree(folders: Folder[]): Folder[] {
    const folderMap = new Map<string, Folder & { children?: Folder[] }>();
    const rootFolders: (Folder & { children?: Folder[] })[] = [];

    // 创建文件夹映射
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // 构建树结构
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;
      
      if (folder.parentId && folderMap.has(folder.parentId)) {
        const parent = folderMap.get(folder.parentId)!;
        parent.children!.push(folderWithChildren);
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  }

  /**
   * 获取单个文件夹
   */
  public async getFolder(id: string): Promise<Folder | null> {
    return this.folders.get(id) || null;
  }

  /**
   * 创建新文件夹
   */
  public async createFolder(folderData: CreateFolderRequest): Promise<Folder> {
    // 检查父文件夹是否存在
    if (folderData.parentId && !this.folders.has(folderData.parentId)) {
      throw new Error('父文件夹不存在');
    }

    // 检查同级文件夹名称是否重复
    const existingFolders = Array.from(this.folders.values());
    const sameLevelFolders = existingFolders.filter(f => f.parentId === folderData.parentId);
    
    if (sameLevelFolders.some(f => f.name === folderData.name)) {
      throw new Error('同级目录下已存在相同名称的文件夹');
    }

    const now = Date.now();
    const folder: Folder = {
      id: uuidv4(),
      name: folderData.name,
      parentId: folderData.parentId,
      createdAt: now,
      updatedAt: now
    };

    this.folders.set(folder.id, folder);
    await this.saveFolders();

    console.log(`创建新文件夹: ${folder.name} (ID: ${folder.id})`);
    return folder;
  }

  /**
   * 更新文件夹
   */
  public async updateFolder(id: string, name: string): Promise<Folder | null> {
    const folder = this.folders.get(id);
    if (!folder) {
      return null;
    }

    // 检查同级文件夹名称是否重复
    const existingFolders = Array.from(this.folders.values());
    const sameLevelFolders = existingFolders.filter(f => 
      f.parentId === folder.parentId && f.id !== id
    );
    
    if (sameLevelFolders.some(f => f.name === name)) {
      throw new Error('同级目录下已存在相同名称的文件夹');
    }

    const updatedFolder: Folder = {
      ...folder,
      name,
      updatedAt: Date.now()
    };

    this.folders.set(id, updatedFolder);
    await this.saveFolders();

    console.log(`更新文件夹: ${updatedFolder.name} (ID: ${id})`);
    return updatedFolder;
  }

  /**
   * 删除文件夹
   */
  public async deleteFolder(id: string): Promise<boolean> {
    const folder = this.folders.get(id);
    if (!folder) {
      return false;
    }

    // 检查是否有子文件夹
    const hasChildren = Array.from(this.folders.values()).some(f => f.parentId === id);
    if (hasChildren) {
      throw new Error('无法删除包含子文件夹的文件夹，请先删除子文件夹');
    }

    // TODO: 检查是否有笔记，这需要与NotesService协调
    // 可以通过依赖注入或者事件系统来实现

    this.folders.delete(id);
    await this.saveFolders();

    console.log(`删除文件夹: ${folder.name} (ID: ${id})`);
    return true;
  }

  /**
   * 移动文件夹
   */
  public async moveFolder(id: string, newParentId?: string): Promise<Folder | null> {
    const folder = this.folders.get(id);
    if (!folder) {
      return null;
    }

    // 检查新父文件夹是否存在
    if (newParentId && !this.folders.has(newParentId)) {
      throw new Error('目标父文件夹不存在');
    }

    // 检查是否会造成循环引用
    if (newParentId && this.wouldCreateCycle(id, newParentId)) {
      throw new Error('无法移动到子文件夹中，这会造成循环引用');
    }

    // 检查同级文件夹名称是否重复
    const existingFolders = Array.from(this.folders.values());
    const sameLevelFolders = existingFolders.filter(f => 
      f.parentId === newParentId && f.id !== id
    );
    
    if (sameLevelFolders.some(f => f.name === folder.name)) {
      throw new Error('目标位置已存在相同名称的文件夹');
    }

    const updatedFolder: Folder = {
      ...folder,
      parentId: newParentId,
      updatedAt: Date.now()
    };

    this.folders.set(id, updatedFolder);
    await this.saveFolders();

    console.log(`移动文件夹: ${updatedFolder.name} (ID: ${id}) 到 ${newParentId || '根目录'}`);
    return updatedFolder;
  }

  /**
   * 检查是否会造成循环引用
   */
  private wouldCreateCycle(folderId: string, newParentId: string): boolean {
    let currentId = newParentId;
    
    while (currentId) {
      if (currentId === folderId) {
        return true;
      }
      
      const parent = this.folders.get(currentId);
      currentId = parent?.parentId || '';
    }
    
    return false;
  }

  /**
   * 获取文件夹路径
   */
  public async getFolderPath(id: string): Promise<string[]> {
    const path: string[] = [];
    let currentId = id;

    while (currentId) {
      const folder = this.folders.get(currentId);
      if (!folder) {
        break;
      }
      
      path.unshift(folder.name);
      currentId = folder.parentId || '';
    }

    return path;
  }

  /**
   * 获取文件夹统计信息
   */
  public getStats(): { totalFolders: number } {
    return {
      totalFolders: this.folders.size
    };
  }
}

module.exports = { FoldersService };