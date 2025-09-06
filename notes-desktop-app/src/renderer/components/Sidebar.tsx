import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder as FolderIcon, 
  Search, 
  Plus, 
  FileText, 
  MessageCircle, 
  BookOpen,
  Sparkles,
  Settings,
  Wifi,
  RefreshCw
} from 'lucide-react';
import { Folder, Note } from '../../types';
import '../styles/SidebarModern.css';

// 为防抖定时器添加全局类型声明
declare global {
  interface Window {
    searchTimeout: number;
  }
}

interface SidebarProps {
  folders: Folder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId?: string) => void;
  onSearch: (query: string) => Promise<Note[]>;
  searchQuery: string;
  currentView: 'agent' | 'notes';
  onViewChange: (view: 'agent' | 'notes') => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onSearch,
  searchQuery,
  currentView,
  onViewChange
}) => {
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [lastChecked, setLastChecked] = useState(new Date());

  // 检查服务器连接状态
  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:3001/health');
      const online = response.ok;
      setIsServerOnline(online);
      setLastChecked(new Date());
      return online;
    } catch (error) {
      setIsServerOnline(false);
      setLastChecked(new Date());
      return false;
    }
  }, []);

  // 定期检查服务器状态
  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, [checkServerStatus]);

  // 使用useCallback优化搜索函数
  const handleSearch = useCallback(async (query: string) => {
    try {
      await onSearch(query);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  }, [onSearch]);

  // 防抖处理搜索输入
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    
    // 使用setTimeout实现简单的防抖
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    window.searchTimeout = window.setTimeout(() => {
      handleSearch(value);
    }, 300) as any;
  }, [handleSearch]);

  // 添加清理函数以防止内存泄漏
  useEffect(() => {
    return () => {
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
    };
  }, []);

  // 同步外部searchQuery变化
  useEffect(() => {
    if (searchQuery !== localSearchQuery) {
      setLocalSearchQuery(searchQuery);
    }
  }, [searchQuery, localSearchQuery]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const hasChildren = folders.some(f => f.parentId === folder.id);
    
    return (
      <div 
        key={folder.id} 
        className="folder-item"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <div
          className={`folder-label ${
            selectedFolder === folder.id ? 'selected' : ''
          }`}
          onClick={() => onSelectFolder(folder.id)}
        >
          <div className="folder-icon">
            <FolderIcon size={16} />
          </div>
          <span className="folder-name">{folder.name}</span>
        </div>
        
        {hasChildren && (
          <div className="folder-children">
            {folders
              .filter(f => f.parentId === folder.id)
              .map(childFolder => renderFolder(childFolder, level + 1))
            }
          </div>
        )}
      </div>
    );
  };

  const navigationItems = [
    {
      id: 'agent',
      label: '智能助手',
      icon: <Sparkles size={18} />,
      view: 'agent' as const,
      description: 'AI驱动的知识对话'
    },
    {
      id: 'notes',
      label: '知识管理',
      icon: <BookOpen size={18} />,
      view: 'notes' as const,
      description: '管理和编辑知识'
    }
  ];

  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div className="sidebar-modern">
      {/* 头部区域 */}
      <div className="sidebar-header-modern">
        <div className="app-logo">
          <div className="logo-icon">
            <MessageCircle size={24} />
          </div>
          <div className="logo-text">
            <h1>知识管理中心</h1>
            <p>Noeton Hub</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <div className="navigation-section">
        <div className="nav-grid">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                currentView === item.view ? 'active' : ''
              }`}
              onClick={() => onViewChange(item.view)}
            >
              <div className="nav-icon">
                {item.icon}
              </div>
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 本地服务状态 */}
      <div className="server-status-section">
        <div className="server-status-card" onClick={checkServerStatus}>
          <div className="status-info">
            <div className={`status-indicator ${
              isServerOnline ? 'online' : 'offline'
            }`}>
              <Wifi size={14} />
            </div>
            <div className="status-content">
              <div className="status-text">
                {isServerOnline ? '本地服务正常' : '服务器离线'}
              </div>
              <div className="status-detail">127.0.0.1:3001</div>
              <div className="status-time">
                上次检查: {lastChecked.toLocaleTimeString()}
              </div>
            </div>
          </div>
          <button
            className="refresh-btn"
            onClick={(e) => {
              e.stopPropagation();
              checkServerStatus();
            }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* 搜索区域 */}
      <div className="search-section-modern">
        <div className="search-container">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="搜索知识内容..."
            value={localSearchQuery}
            onChange={handleSearchInput}
            className="search-input-modern"
          />
        </div>
      </div>

      {/* 文件夹区域 - 仅在知识视图中显示 */}
      {currentView === 'notes' && (
        <div className="folders-section-modern">
          <div className="section-header-modern">
            <div className="header-content">
              <FolderIcon size={16} />
              <h3>文件夹</h3>
            </div>
            <button
              className="add-folder-btn-modern"
              onClick={() => setShowCreateFolder(true)}
              title="新建文件夹"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="folders-list-modern">
            <div
              className={`folder-item all-notes ${
                selectedFolder === null ? 'selected' : ''
              }`}
              onClick={() => onSelectFolder(null)}
            >
              <div className="folder-icon">
                <FileText size={16} />
              </div>
              <span className="folder-name">所有知识</span>
            </div>

            {rootFolders.map(folder => renderFolder(folder))}
          </div>

          {showCreateFolder && (
            <form 
              onSubmit={handleCreateFolder} 
              className="create-folder-form-modern"
            >
              <input
                type="text"
                placeholder="输入文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="folder-name-input-modern"
                autoFocus
              />
              <div className="form-actions-modern">
                <button 
                  type="submit" 
                  className="create-btn-modern"
                >
                  创建
                </button>
                <button
                  type="button"
                  className="cancel-btn-modern"
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 底部设置 */}
      <div className="sidebar-footer-modern">
        <button
          className="settings-btn-modern"
          title="设置"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;