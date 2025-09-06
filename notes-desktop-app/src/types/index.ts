// 知识相关类型定义
export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  tags: string[];
  url?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: {
    source?: string;
    userAgent?: string;
    originalTitle?: string;
  };
}

// 文件夹类型定义
export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}

// API请求/响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  folderId?: string;
  tags?: string[];
  url?: string;
  metadata?: Note['metadata'];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  folderId?: string;
  tags?: string[];
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

// 知识列表查询参数
export interface NotesQuery {
  page?: number;
  limit?: number;
  folderId?: string;
  search?: string;
  tags?: string[];
}

// 应用配置
export interface AppConfig {
  dataPath: string;
  serverPort: number;
  autoStart: boolean;
  theme: 'light' | 'dark';
}

// 服务器状态
export interface ServerStatus {
  running: boolean;
  port: number;
  version: string;
}

// Agent对话相关类型
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  searchResults?: Note[];
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// DeepSeek API配置
export interface DeepSeekConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// 搜索配置
export interface SearchConfig {
  maxResults: number;
  similarityThreshold: number;
  includeContent: boolean;
}

