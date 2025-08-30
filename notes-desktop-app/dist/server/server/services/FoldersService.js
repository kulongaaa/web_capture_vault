"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoldersService = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
/**
 * 文件夹服务类 - 负责文件夹的管理
 */
class FoldersService {
    constructor() {
        this.folders = new Map();
        // 获取用户数据目录
        this.dataDir = this.getDataDirectory();
        this.foldersFile = path.join(this.dataDir, 'folders.json');
        this.initializeData();
    }
    /**
     * 获取数据存储目录
     */
    getDataDirectory() {
        const os = require('os');
        const appName = 'NotesDesktopApp';
        let dataDir;
        if (process.platform === 'win32') {
            dataDir = path.join(os.homedir(), 'AppData', 'Roaming', appName);
        }
        else if (process.platform === 'darwin') {
            dataDir = path.join(os.homedir(), 'Library', 'Application Support', appName);
        }
        else {
            dataDir = path.join(os.homedir(), '.config', appName);
        }
        return dataDir;
    }
    /**
     * 初始化数据
     */
    async initializeData() {
        try {
            // 确保数据目录存在
            await fs_1.promises.mkdir(this.dataDir, { recursive: true });
            // 加载现有文件夹
            await this.loadFolders();
        }
        catch (error) {
            console.error('初始化文件夹数据失败:', error);
            throw error;
        }
    }
    /**
     * 从文件加载文件夹
     */
    async loadFolders() {
        try {
            const data = await fs_1.promises.readFile(this.foldersFile, 'utf-8');
            const foldersArray = JSON.parse(data);
            this.folders.clear();
            foldersArray.forEach(folder => {
                this.folders.set(folder.id, folder);
            });
            console.log(`已加载 ${this.folders.size} 个文件夹`);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在，创建默认文件夹结构
                await this.createDefaultFolders();
                console.log('创建默认文件夹结构');
            }
            else {
                console.error('加载文件夹失败:', error);
                throw error;
            }
        }
    }
    /**
     * 创建默认文件夹结构
     */
    async createDefaultFolders() {
        const now = Date.now();
        const defaultFolders = [
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
    async saveFolders() {
        try {
            const foldersArray = Array.from(this.folders.values());
            await fs_1.promises.writeFile(this.foldersFile, JSON.stringify(foldersArray, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('保存文件夹失败:', error);
            throw error;
        }
    }
    /**
     * 获取文件夹树结构
     */
    async getFolders() {
        const folders = Array.from(this.folders.values());
        // 按创建时间排序
        folders.sort((a, b) => a.createdAt - b.createdAt);
        return this.buildFolderTree(folders);
    }
    /**
     * 构建文件夹树结构
     */
    buildFolderTree(folders) {
        const folderMap = new Map();
        const rootFolders = [];
        // 创建文件夹映射
        folders.forEach(folder => {
            folderMap.set(folder.id, { ...folder, children: [] });
        });
        // 构建树结构
        folders.forEach(folder => {
            const folderWithChildren = folderMap.get(folder.id);
            if (folder.parentId && folderMap.has(folder.parentId)) {
                const parent = folderMap.get(folder.parentId);
                parent.children.push(folderWithChildren);
            }
            else {
                rootFolders.push(folderWithChildren);
            }
        });
        return rootFolders;
    }
    /**
     * 获取单个文件夹
     */
    async getFolder(id) {
        return this.folders.get(id) || null;
    }
    /**
     * 创建新文件夹
     */
    async createFolder(folderData) {
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
        const folder = {
            id: (0, uuid_1.v4)(),
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
    async updateFolder(id, name) {
        const folder = this.folders.get(id);
        if (!folder) {
            return null;
        }
        // 检查同级文件夹名称是否重复
        const existingFolders = Array.from(this.folders.values());
        const sameLevelFolders = existingFolders.filter(f => f.parentId === folder.parentId && f.id !== id);
        if (sameLevelFolders.some(f => f.name === name)) {
            throw new Error('同级目录下已存在相同名称的文件夹');
        }
        const updatedFolder = {
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
    async deleteFolder(id) {
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
    async moveFolder(id, newParentId) {
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
        const sameLevelFolders = existingFolders.filter(f => f.parentId === newParentId && f.id !== id);
        if (sameLevelFolders.some(f => f.name === folder.name)) {
            throw new Error('目标位置已存在相同名称的文件夹');
        }
        const updatedFolder = {
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
    wouldCreateCycle(folderId, newParentId) {
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
    async getFolderPath(id) {
        const path = [];
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
    getStats() {
        return {
            totalFolders: this.folders.size
        };
    }
}
exports.FoldersService = FoldersService;
module.exports = { FoldersService };
