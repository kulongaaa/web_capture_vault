import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Note } from '../../types';

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (id: string, updateData: { title: string; content: string }) => void;
  onCreateNote: (noteData: { title: string; content: string }) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdateNote,
  onCreateNote
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 当选中的笔记改变时，更新编辑器内容
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setHasChanges(false);
    } else {
      setTitle('');
      setContent('');
      setHasChanges(false);
    }
  }, [note]);

  // 监听内容变化
  useEffect(() => {
    if (note) {
      const titleChanged = title !== note.title;
      const contentChanged = content !== note.content;
      setHasChanges(titleChanged || contentChanged);
    } else {
      setHasChanges(title.length > 0 || content.length > 0);
    }
  }, [title, content, note]);

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入笔记标题');
      return;
    }

    if (note) {
      onUpdateNote(note.id, { title: title.trim(), content });
    } else {
      onCreateNote({ title: title.trim(), content });
    }
    
    setHasChanges(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
  };

  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    const textarea = document.querySelector('.content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newContent = '';
    let newCursorPos = start;

    switch (syntax) {
      case 'bold':
        newContent = content.substring(0, start) + 
                    `**${selectedText || placeholder}**` + 
                    content.substring(end);
        newCursorPos = start + 2 + (selectedText || placeholder).length;
        break;
      case 'italic':
        newContent = content.substring(0, start) + 
                    `*${selectedText || placeholder}*` + 
                    content.substring(end);
        newCursorPos = start + 1 + (selectedText || placeholder).length;
        break;
      case 'code':
        newContent = content.substring(0, start) + 
                    `\`${selectedText || placeholder}\`` + 
                    content.substring(end);
        newCursorPos = start + 1 + (selectedText || placeholder).length;
        break;
      case 'link':
        newContent = content.substring(0, start) + 
                    `[${selectedText || '链接文本'}](${placeholder || 'https://example.com'})` + 
                    content.substring(end);
        newCursorPos = start + (selectedText ? selectedText.length + 3 : 5);
        break;
      case 'heading':
        newContent = content.substring(0, start) + 
                    `\n## ${selectedText || placeholder}\n` + 
                    content.substring(end);
        newCursorPos = start + 4 + (selectedText || placeholder).length;
        break;
      case 'list':
        newContent = content.substring(0, start) + 
                    `\n- ${selectedText || placeholder}\n` + 
                    content.substring(end);
        newCursorPos = start + 3 + (selectedText || placeholder).length;
        break;
    }

    setContent(newContent);
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="note-editor" onKeyDown={handleKeyDown}>
      {note || title || content ? (
        <>
          <div className="editor-header">
            <input
              type="text"
              placeholder="输入笔记标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="title-input"
            />
            
            <div className="editor-actions">
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${!isPreview ? 'active' : ''}`}
                  onClick={() => setIsPreview(false)}
                >
                  编辑
                </button>
                <button
                  className={`toggle-btn ${isPreview ? 'active' : ''}`}
                  onClick={() => setIsPreview(true)}
                >
                  预览
                </button>
              </div>
              
              {hasChanges && (
                <button className="save-btn" onClick={handleSave}>
                  保存 (Ctrl+S)
                </button>
              )}
            </div>
          </div>

          {!isPreview && (
            <div className="editor-toolbar">
              <button
                className="toolbar-btn"
                onClick={() => insertMarkdown('bold', '粗体文本')}
                title="粗体"
              >
                <strong>B</strong>
              </button>
              <button
                className="toolbar-btn"
                onClick={() => insertMarkdown('italic', '斜体文本')}
                title="斜体"
              >
                <em>I</em>
              </button>
              <button
                className="toolbar-btn"
                onClick={() => insertMarkdown('code', '代码')}
                title="行内代码"
              >
                &lt;/&gt;
              </button>
              <button
                className="toolbar-btn"
                onClick={() => insertMarkdown('link')}
                title="链接"
              >
                🔗
              </button>
              <button
                className="toolbar-btn"
                onClick={() => insertMarkdown('heading', '标题')}
                title="标题"
              >
                H
              </button>
              <button
                className="toolbar-btn"
                onClick={() => insertMarkdown('list', '列表项')}
                title="列表"
              >
                •
              </button>
            </div>
          )}

          <div className="editor-content">
            {isPreview ? (
              <div className="markdown-preview">
                <ReactMarkdown>{content || '*无内容*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                placeholder="开始编写你的笔记... 支持 Markdown 格式"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="content-textarea"
              />
            )}
          </div>

          {note && (
            <div className="editor-footer">
              <div className="note-info">
                <span>创建时间: {formatDate(note.createdAt)}</span>
                <span>更新时间: {formatDate(note.updatedAt)}</span>
                {note.url && (
                  <span>
                    来源: <a href={note.url} target="_blank" rel="noopener noreferrer">
                      {note.url}
                    </a>
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-editor">
          <div className="empty-icon">📝</div>
          <h3>选择一个笔记开始编辑</h3>
          <p>或者创建一个新笔记来开始写作</p>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;