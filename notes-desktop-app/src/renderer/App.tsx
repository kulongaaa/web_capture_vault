import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note, Folder, ChatMessage } from '../types';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import AgentHomepage from './components/AgentHomepage';
import { NotesApiService } from './services/NotesApiService';
import ChatService from './services/ChatService';
import SmartSearchService from './services/SmartSearchService';
import './styles/App.css';

interface AppState {
  notes: Note[];
  folders: Folder[];
  selectedNote: Note | null;
  selectedFolder: string | null;
  isLoading: boolean;
  searchQuery: string;
  error: string | null;
  currentView: 'agent' | 'notes';
  chatMessages: ChatMessage[];
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    notes: [],
    folders: [],
    selectedNote: null,
    selectedFolder: null,
    isLoading: true, // 初始状态为加载中
    searchQuery: '',
    error: null,
    currentView: 'agent', // 默认显示Agent首页
    chatMessages: []
  });

  const [apiService] = useState(() => new NotesApiService());
  const [chatService] = useState(() => new ChatService({
    apiKey: '', // 这里后续会从配置中加载
    model: 'deepseek-chat'
  }));
  const [searchService] = useState(() => new SmartSearchService());

  // 加载初始数据
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    console.log('开始加载初始数据...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 先测试连接
      console.log('测试服务器连接...');
      const isConnected = await apiService.testConnection();
      if (!isConnected) {
        throw new Error('无法连接到本地服务器 (http://127.0.0.1:3001)');
      }
      
      console.log('调用 API 服务...');
      const [notesResult, foldersResult] = await Promise.all([
        apiService.getNotes({}),
        apiService.getFolders()
      ]);

      console.log('数据加载成功:', {
        notes: notesResult.notes.length,
        folders: foldersResult.length
      });

      setState(prev => ({
        ...prev,
        notes: notesResult.notes,
        folders: foldersResult,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('加载数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `加载失败: ${errorMessage}`
      }));
    }
  };

  const handleSelectNote = (note: Note) => {
    setState(prev => ({ ...prev, selectedNote: note }));
  };

  const handleSelectFolder = (folderId: string | null) => {
    setState(prev => ({ ...prev, selectedFolder: folderId, selectedNote: null }));
    loadNotesForFolder(folderId);
  };

  const loadNotesForFolder = async (folderId: string | null) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await apiService.getNotes({ folderId: folderId || undefined });
      setState(prev => ({
        ...prev,
        notes: result.notes,
        isLoading: false
      }));
    } catch (error) {
      console.error('加载文件夹知识失败:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 切换视图
  const handleViewChange = (view: 'agent' | 'notes') => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  // 导航到知识页面
  const handleNavigateToNotes = () => {
    setState(prev => ({ ...prev, currentView: 'notes' }));
  };

  // Agent搜索函数（返回Promise）
  const handleAgentSearch = async (query: string): Promise<Note[]> => {
    return await handleSearch(query);
  };

  const handleCreateNote = async (noteData: { title: string; content: string }) => {
    try {
      const newNote = await apiService.createNote({
        ...noteData,
        folderId: state.selectedFolder || undefined
      });

      setState(prev => ({
        ...prev,
        notes: [newNote, ...prev.notes],
        selectedNote: newNote
      }));
    } catch (error) {
      console.error('创建知识失败:', error);
    }
  };

  const handleUpdateNote = async (id: string, updateData: { title: string; content: string }) => {
    try {
      const updatedNote = await apiService.updateNote(id, updateData);
      if (updatedNote) {
        setState(prev => ({
          ...prev,
          notes: prev.notes.map(note => note.id === id ? updatedNote : note),
          selectedNote: updatedNote
        }));
      }
    } catch (error) {
      console.error('更新知识失败:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await apiService.deleteNote(id);
      setState(prev => ({
        ...prev,
        notes: prev.notes.filter(note => note.id !== id),
        selectedNote: prev.selectedNote?.id === id ? null : prev.selectedNote
      }));
    } catch (error) {
      console.error('删除知识失败:', error);
    }
  };

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      const newFolder = await apiService.createFolder({ name, parentId });
      setState(prev => ({ ...prev, folders: [...prev.folders, newFolder] }));
    } catch (error) {
      console.error('创建文件夹失败:', error);
    }
  };

  const handleSearch = async (query: string): Promise<Note[]> => {
    // 避免不必要的状态更新导致重新渲染
    if (state.searchQuery === query) {
      return state.notes;
    }
    
    setState(prev => ({ ...prev, searchQuery: query }));
    
    if (!query.trim()) {
      // 重新加载所有知识，但不设置loading状态避免重置
      try {
        const result = await apiService.getNotes({ folderId: state.selectedFolder || undefined });
        const notes = result.notes;
        setState(prev => ({ ...prev, notes }));
        return notes;
      } catch (error) {
        console.error('重新加载知识失败:', error);
        return state.notes;
      }
    }

    try {
      // 使用智能搜索服务
      const searchResults = await searchService.searchNotes(state.notes, query);
      const notes = searchResults.map(result => result.note);
      
      setState(prev => ({ ...prev, notes }));
      return notes;
    } catch (error) {
      console.error('搜索失败:', error);
      return state.notes;
    }
  };

  return (
    <div className="app">
      {state.error ? (
        <div className="error-overlay">
          <div className="error-message">
            <h3>连接失败</h3>
            <p>{state.error}</p>
            <button onClick={loadInitialData} className="retry-btn">
              重新连接
            </button>
          </div>
        </div>
      ) : state.isLoading ? (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>正在启动知识管理中心...</p>
          </div>
        </div>
      ) : (
        <div className="app-layout">
          <Sidebar
            folders={state.folders}
            selectedFolder={state.selectedFolder}
            onSelectFolder={handleSelectFolder}
            onCreateFolder={handleCreateFolder}
            onSearch={handleSearch}
            searchQuery={state.searchQuery}
            currentView={state.currentView}
            onViewChange={handleViewChange}
          />
          
          <div className="main-content">
            <AnimatePresence mode="wait">
              {state.currentView === 'agent' ? (
                <motion.div
                  key="agent"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="agent-view"
                >
                  <AgentHomepage
                    notes={state.notes}
                    onSearch={handleAgentSearch}
                    onNavigateToNotes={handleNavigateToNotes}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="notes-view"
                >
                  <NoteList
                    notes={state.notes}
                    selectedNote={state.selectedNote}
                    onSelectNote={handleSelectNote}
                    onCreateNote={handleCreateNote}
                    onDeleteNote={handleDeleteNote}
                    isLoading={false}
                  />
                  
                  <NoteEditor
                    note={state.selectedNote}
                    onUpdateNote={handleUpdateNote}
                    onCreateNote={handleCreateNote}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;