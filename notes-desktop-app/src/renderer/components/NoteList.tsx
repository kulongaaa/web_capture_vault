import React, { useState } from 'react';
import { Note } from '../../types';

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onCreateNote: (noteData: { title: string; content: string }) => void;
  onDeleteNote: (id: string) => void;
  isLoading: boolean;
}

const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNote,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  isLoading
}) => {
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteTitle.trim()) {
      onCreateNote({
        title: newNoteTitle.trim(),
        content: ''
      });
      setNewNoteTitle('');
      setShowCreateNote(false);
    }
  };

  const handleDeleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个笔记吗？')) {
      onDeleteNote(id);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('zh-CN', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const getPreviewText = (content: string, maxLength: number = 100) => {
    // 移除 Markdown 格式
    const plainText = content
      .replace(/#{1,6}\s+/g, '')  // 标题
      .replace(/\*\*(.*?)\*\*/g, '$1')  // 粗体
      .replace(/\*(.*?)\*/g, '$1')  // 斜体
      .replace(/`(.*?)`/g, '$1')  // 行内代码
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')  // 链接
      .replace(/!\[.*?\]\(.*?\)/g, '')  // 图片
      .replace(/\n+/g, ' ')  // 换行
      .trim();

    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  };

  return (
    <div className="note-list">
      <div className="note-list-header">
        <h3>笔记列表 ({notes.length})</h3>
        <button
          className="new-note-btn"
          onClick={() => setShowCreateNote(true)}
          title="新建笔记"
        >
          ➕ 新建笔记
        </button>
      </div>

      {showCreateNote && (
        <form onSubmit={handleCreateNote} className="create-note-form">
          <input
            type="text"
            placeholder="笔记标题"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            className="note-title-input"
            autoFocus
          />
          <div className="form-actions">
            <button type="submit" className="create-btn">创建</button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setShowCreateNote(false);
                setNewNoteTitle('');
              }}
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="notes-container">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>加载中...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h4>暂无笔记</h4>
            <p>点击上方的"新建笔记"按钮创建第一个笔记</p>
          </div>
        ) : (
          <div className="notes-list">
            {notes.map(note => (
              <div
                key={note.id}
                className={`note-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
                onClick={() => onSelectNote(note)}
              >
                <div className="note-header">
                  <h4 className="note-title">{note.title}</h4>
                  <button
                    className="delete-note-btn"
                    onClick={(e) => handleDeleteNote(e, note.id)}
                    title="删除笔记"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="note-preview">
                  {getPreviewText(note.content)}
                </div>
                
                <div className="note-meta">
                  <span className="note-date">
                    {formatDate(note.updatedAt)}
                  </span>
                  
                  {note.tags.length > 0 && (
                    <div className="note-tags">
                      {note.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="tag-more">+{note.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  {note.url && (
                    <div className="note-source">
                      <span className="source-icon">🔗</span>
                      <span className="source-text">来自网页</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;