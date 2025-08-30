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
exports.NotesService = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
/**
 * 笔记服务类 - 负责笔记的CRUD操作
 */
class NotesService {
    constructor() {
        this.notes = new Map();
        // 获取用户数据目录
        this.dataDir = this.getDataDirectory();
        this.notesFile = path.join(this.dataDir, 'notes.json');
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
            // 加载现有笔记
            await this.loadNotes();
        }
        catch (error) {
            console.error('初始化笔记数据失败:', error);
            throw error;
        }
    }
    /**
     * 从文件加载笔记
     */
    async loadNotes() {
        try {
            const data = await fs_1.promises.readFile(this.notesFile, 'utf-8');
            const notesArray = JSON.parse(data);
            this.notes.clear();
            notesArray.forEach(note => {
                this.notes.set(note.id, note);
            });
            console.log(`已加载 ${this.notes.size} 个笔记`);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在，创建空文件
                await this.saveNotes();
                console.log('创建新的笔记文件');
            }
            else {
                console.error('加载笔记失败:', error);
                throw error;
            }
        }
    }
    /**
     * 保存笔记到文件
     */
    async saveNotes() {
        try {
            const notesArray = Array.from(this.notes.values());
            await fs_1.promises.writeFile(this.notesFile, JSON.stringify(notesArray, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('保存笔记失败:', error);
            throw error;
        }
    }
    /**
     * 获取笔记列表
     */
    async getNotes(query) {
        let filteredNotes = Array.from(this.notes.values());
        // 按文件夹过滤
        if (query.folderId) {
            filteredNotes = filteredNotes.filter(note => note.folderId === query.folderId);
        }
        // 按标签过滤
        if (query.tags && query.tags.length > 0) {
            filteredNotes = filteredNotes.filter(note => query.tags.some((tag) => note.tags.includes(tag)));
        }
        // 搜索过滤
        if (query.search) {
            const searchLower = query.search.toLowerCase();
            filteredNotes = filteredNotes.filter(note => note.title.toLowerCase().includes(searchLower) ||
                note.content.toLowerCase().includes(searchLower) ||
                note.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
        }
        // 按更新时间降序排序
        filteredNotes.sort((a, b) => b.updatedAt - a.updatedAt);
        const total = filteredNotes.length;
        const page = query.page || 1;
        const limit = query.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedNotes = filteredNotes.slice(startIndex, endIndex);
        return {
            notes: paginatedNotes,
            total,
            page,
            limit
        };
    }
    /**
     * 获取单个笔记
     */
    async getNote(id) {
        return this.notes.get(id) || null;
    }
    /**
     * 创建新笔记
     */
    async createNote(noteData) {
        const now = Date.now();
        const note = {
            id: (0, uuid_1.v4)(),
            title: noteData.title,
            content: noteData.content,
            folderId: noteData.folderId,
            tags: noteData.tags || [],
            url: noteData.url,
            createdAt: now,
            updatedAt: now,
            metadata: noteData.metadata
        };
        this.notes.set(note.id, note);
        await this.saveNotes();
        console.log(`创建新笔记: ${note.title} (ID: ${note.id})`);
        return note;
    }
    /**
     * 更新笔记
     */
    async updateNote(id, updateData) {
        const note = this.notes.get(id);
        if (!note) {
            return null;
        }
        const updatedNote = {
            ...note,
            ...updateData,
            updatedAt: Date.now()
        };
        this.notes.set(id, updatedNote);
        await this.saveNotes();
        console.log(`更新笔记: ${updatedNote.title} (ID: ${id})`);
        return updatedNote;
    }
    /**
     * 删除笔记
     */
    async deleteNote(id) {
        const note = this.notes.get(id);
        if (!note) {
            return false;
        }
        this.notes.delete(id);
        await this.saveNotes();
        console.log(`删除笔记: ${note.title} (ID: ${id})`);
        return true;
    }
    /**
     * 搜索笔记
     */
    async searchNotes(query) {
        const searchLower = query.toLowerCase();
        const results = Array.from(this.notes.values()).filter(note => note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchLower)));
        // 按相关性排序（简单实现：标题匹配优先）
        results.sort((a, b) => {
            const aInTitle = a.title.toLowerCase().includes(searchLower);
            const bInTitle = b.title.toLowerCase().includes(searchLower);
            if (aInTitle && !bInTitle)
                return -1;
            if (!aInTitle && bInTitle)
                return 1;
            return b.updatedAt - a.updatedAt;
        });
        return results;
    }
    /**
     * 获取统计信息
     */
    async getStats() {
        const notes = Array.from(this.notes.values());
        // 最近的笔记（最近7天）
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentNotes = notes
            .filter(note => note.createdAt > sevenDaysAgo)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);
        // 标签统计
        const tagCounts = new Map();
        notes.forEach(note => {
            note.tags.forEach((tag) => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });
        const popularTags = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            totalNotes: notes.length,
            totalFolders: 0, // 将在FoldersService中实现
            recentNotes,
            popularTags
        };
    }
}
exports.NotesService = NotesService;
module.exports = { NotesService };
