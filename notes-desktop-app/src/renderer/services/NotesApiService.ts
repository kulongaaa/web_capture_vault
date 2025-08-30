import { 
  Note, 
  Folder, 
  CreateNoteRequest, 
  UpdateNoteRequest, 
  CreateFolderRequest, 
  NotesQuery, 
  ApiResponse 
} from '../../types';

/**
 * 前端API服务类 - 与本地HTTP服务器通信
 */
export class NotesApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:3001/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * 通用HTTP请求方法
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || result.message || '请求失败');
      }

      return result.data as T;
    } catch (error) {
      console.error(`API请求失败 [${options.method || 'GET'} ${url}]:`, error);
      throw error;
    }
  }

  // === 笔记相关方法 ===

  /**
   * 获取笔记列表
   */
  async getNotes(query: NotesQuery = {}): Promise<{
    notes: Note[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.folderId) params.append('folderId', query.folderId);
    if (query.search) params.append('search', query.search);
    if (query.tags?.length) params.append('tags', query.tags.join(','));

    const queryString = params.toString();
    const endpoint = `/notes${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * 获取单个笔记
   */
  async getNote(id: string): Promise<Note> {
    return this.request(`/notes/${id}`);
  }

  /**
   * 创建新笔记
   */
  async createNote(noteData: CreateNoteRequest): Promise<Note> {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  /**
   * 更新笔记
   */
  async updateNote(id: string, updateData: UpdateNoteRequest): Promise<Note> {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: string): Promise<void> {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * 搜索笔记
   */
  async searchNotes(query: string): Promise<Note[]> {
    const params = new URLSearchParams({ q: query });
    return this.request(`/search?${params.toString()}`);
  }

  // === 文件夹相关方法 ===

  /**
   * 获取文件夹列表
   */
  async getFolders(): Promise<Folder[]> {
    return this.request('/folders');
  }

  /**
   * 创建文件夹
   */
  async createFolder(folderData: CreateFolderRequest): Promise<Folder> {
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify(folderData),
    });
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(id: string): Promise<void> {
    return this.request(`/folders/${id}`, {
      method: 'DELETE',
    });
  }

  // === 统计相关方法 ===

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    totalNotes: number;
    totalFolders: number;
    recentNotes: Note[];
    popularTags: Array<{ tag: string; count: number }>;
  }> {
    return this.request('/stats');
  }

  // === 连接测试 ===

  /**
   * 测试服务器连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('连接测试失败:', error);
      return false;
    }
  }

  /**
   * 获取API版本信息
   */
  async getVersion(): Promise<{
    version: string;
    apiVersion: string;
    features: string[];
  }> {
    return this.request('/version');
  }
}