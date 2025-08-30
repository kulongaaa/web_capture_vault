import React, { useState } from 'react';
import { Folder } from '../../types';

interface SidebarProps {
  folders: Folder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId?: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onSearch,
  searchQuery
}) => {
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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
      <div key={folder.id} className="folder-item" style={{ paddingLeft: `${level * 20}px` }}>
        <div
          className={`folder-label ${selectedFolder === folder.id ? 'selected' : ''}`}
          onClick={() => onSelectFolder(folder.id)}
        >
          <span className="folder-icon">
            {hasChildren ? '📁' : '📄'}
          </span>
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

  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>笔记管理</h2>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="搜索笔记..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="folders-section">
        <div className="section-header">
          <h3>文件夹</h3>
          <button
            className="add-folder-btn"
            onClick={() => setShowCreateFolder(true)}
            title="新建文件夹"
          >
            ➕
          </button>
        </div>

        <div className="folders-list">
          <div
            className={`folder-item all-notes ${selectedFolder === null ? 'selected' : ''}`}
            onClick={() => onSelectFolder(null)}
          >
            <span className="folder-icon">📝</span>
            <span className="folder-name">所有笔记</span>
          </div>

          {rootFolders.map(folder => renderFolder(folder))}
        </div>

        {showCreateFolder && (
          <form onSubmit={handleCreateFolder} className="create-folder-form">
            <input
              type="text"
              placeholder="文件夹名称"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="folder-name-input"
              autoFocus
            />
            <div className="form-actions">
              <button type="submit" className="create-btn">创建</button>
              <button
                type="button"
                className="cancel-btn"
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

      <div className="sidebar-footer">
        <div className="server-status">
          <span className="status-indicator online"></span>
          <span className="status-text">本地服务运行中</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;