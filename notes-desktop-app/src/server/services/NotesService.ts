import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Note, CreateNoteRequest, UpdateNoteRequest, NotesQuery } from '../../types';

/**
 * 知识服务类 - 负责知识的CRUD操作
 */
export class NotesService {
  private dataDir: string;
  private notesFile: string;
  private notes: Map<string, Note> = new Map();

  constructor() {
    // 获取用户数据目录
    this.dataDir = this.getDataDirectory();
    this.notesFile = path.join(this.dataDir, 'notes.json');
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
      
      // 加载现有知识
      await this.loadNotes();
    } catch (error) {
      console.error('初始化知识数据失败:', error);
      throw error;
    }
  }

  /**
   * 从文件加载知识
   */
  private async loadNotes(): Promise<void> {
    try {
      const data = await fs.readFile(this.notesFile, 'utf-8');
      const notesArray: Note[] = JSON.parse(data);
      
      this.notes.clear();
      notesArray.forEach(note => {
        this.notes.set(note.id, note);
      });
      
      console.log(`已加载 ${this.notes.size} 个知识`);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // 文件不存在，创建空文件
        await this.saveNotes();
        console.log('创建新的知识文件');
      } else {
        console.error('加载知识失败:', error);
        throw error;
      }
    }
  }

  /**
   * 保存知识到文件
   */
  private async saveNotes(): Promise<void> {
    try {
      const notesArray = Array.from(this.notes.values());
      await fs.writeFile(this.notesFile, JSON.stringify(notesArray, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存知识失败:', error);
      throw error;
    }
  }

  /**
   * 获取知识列表
   */
  public async getNotes(query: NotesQuery): Promise<{
    notes: Note[];
    total: number;
    page: number;
    limit: number;
  }> {
    let filteredNotes = Array.from(this.notes.values());

    // 按文件夹过滤
    if (query.folderId) {
      filteredNotes = filteredNotes.filter(note => note.folderId === query.folderId);
    }

    // 按标签过滤
    if (query.tags && query.tags.length > 0) {
      filteredNotes = filteredNotes.filter(note => 
        query.tags!.some((tag: string) => note.tags.includes(tag))
      );
    }

    // 搜索过滤
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
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
   * 获取单个知识
   */
  public async getNote(id: string): Promise<Note | null> {
    return this.notes.get(id) || null;
  }

  /**
   * 创建新知识
   */
  public async createNote(noteData: CreateNoteRequest): Promise<Note> {
    const now = Date.now();
    const note: Note = {
      id: uuidv4(),
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

    console.log(`创建新知识: ${note.title} (ID: ${note.id})`);
    return note;
  }

  /**
   * 更新知识
   */
  public async updateNote(id: string, updateData: UpdateNoteRequest): Promise<Note | null> {
    const note = this.notes.get(id);
    if (!note) {
      return null;
    }

    const updatedNote: Note = {
      ...note,
      ...updateData,
      updatedAt: Date.now()
    };

    this.notes.set(id, updatedNote);
    await this.saveNotes();

    console.log(`更新知识: ${updatedNote.title} (ID: ${id})`);
    return updatedNote;
  }

  /**
   * 删除知识
   */
  public async deleteNote(id: string): Promise<boolean> {
    const note = this.notes.get(id);
    if (!note) {
      return false;
    }

    this.notes.delete(id);
    await this.saveNotes();

    console.log(`删除知识: ${note.title} (ID: ${id})`);
    return true;
  }

  /**
   * 搜索知识
   */
  public async searchNotes(query: string): Promise<Note[]> {
    const searchLower = query.toLowerCase();
    const results = Array.from(this.notes.values()).filter(note => 
      note.title.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );

    // 按相关性排序（简单实现：标题匹配优先）
    results.sort((a, b) => {
      const aInTitle = a.title.toLowerCase().includes(searchLower);
      const bInTitle = b.title.toLowerCase().includes(searchLower);
      
      if (aInTitle && !bInTitle) return -1;
      if (!aInTitle && bInTitle) return 1;
      
      return b.updatedAt - a.updatedAt;
    });

    return results;
  }

  /**
   * 获取统计信息
   */
  public async getStats(): Promise<{
    totalNotes: number;
    totalFolders: number;
    recentNotes: Note[];
    popularTags: Array<{ tag: string; count: number }>;
  }> {
    const notes = Array.from(this.notes.values());
    
    // 最近的知识（最近7天）
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentNotes = notes
      .filter(note => note.createdAt > sevenDaysAgo)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    // 标签统计
    const tagCounts = new Map<string, number>();
    notes.forEach(note => {
      note.tags.forEach((tag: string) => {
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

module.exports = { NotesService };