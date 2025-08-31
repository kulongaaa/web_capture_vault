import React, { useState, useEffect } from 'react';
import { Note, Folder } from '../types';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import { NotesApiService } from './services/NotesApiService';
import './styles/App.css';

interface AppState {
  notes: Note[];
  folders: Folder[];
  selectedNote: Note | null;
  selectedFolder: string | null;
  isLoading: boolean;
  searchQuery: string;
  error: string | null;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    notes: [],
    folders: [],
    selectedNote: null,
    selectedFolder: null,
    isLoading: true, // 初始状态为加载中
    searchQuery: '',
    error: null
  });

  const [apiService] = useState(() => new NotesApiService());

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
      console.error('加载文件夹笔记失败:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
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
      console.error('创建笔记失败:', error);
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
      console.error('更新笔记失败:', error);
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
      console.error('删除笔记失败:', error);
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

  const handleSearch = async (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query, isLoading: true }));
    
    if (!query.trim()) {
      loadNotesForFolder(state.selectedFolder);
      return;
    }

    try {
      const results = await apiService.searchNotes(query);
      setState(prev => ({
        ...prev,
        notes: results,
        isLoading: false
      }));
    } catch (error) {
      console.error('搜索失败:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="app">
      {state.error ? (
        <div className="error-overlay">
          <div className="error-message">
            <h3>加载出错</h3>
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
            <p>正在加载笔记应用...</p>
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
          />
          
          <div className="main-content">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default App;