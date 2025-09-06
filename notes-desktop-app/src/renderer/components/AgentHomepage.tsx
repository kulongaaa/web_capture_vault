import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  Brain, 
  Send, 
  Loader2, 
  Plus, 
  ArrowLeft,
  Target,
  Activity
} from 'lucide-react';
import { ChatMessage, Note } from '../../types';
import '../styles/AgentHomepage.css';



declare global {
  interface Window {
    neuralTimeout: number;
  }
}

interface AgentHomepageProps {
  notes: Note[];
  onSearch: (query: string) => Promise<Note[]>;
  onNavigateToNotes: () => void;
}

const neuralAnimations = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15
      }
    }
  },
  
  neuralItem: {
    hidden: { 
      opacity: 0, 
      y: 60, 
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.6
      }
    }
  }
};

const AgentHomepage: React.FC<AgentHomepageProps> = ({
  notes,
  onSearch,
  onNavigateToNotes
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: inputValue.trim(),
      role: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setShowChat(true);

    try {
      const searchResults = await onSearch(currentInput);
      
      setTimeout(async () => {
        try {
          const assistantMessage: ChatMessage = {
            id: `assistant_${Date.now()}`,
            content: await generateNeuralResponse(currentInput, searchResults),
            role: 'assistant',
            timestamp: Date.now(),
            searchResults: searchResults.slice(0, 4)
          };

          setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
          const errorMessage: ChatMessage = {
            id: `error_${Date.now()}`,
            content: '抱歉，处理过程中发生错误。请稍后再试。',
            role: 'assistant',
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
      }, 1800);

    } catch (error) {
      console.error('交互失败:', error);
      setIsLoading(false);
    }
  }, [inputValue, isLoading, onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  useEffect(() => {
    return () => {
      if (window.neuralTimeout) {
        clearTimeout(window.neuralTimeout);
      }
    };
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const generateNeuralResponse = async (query: string, searchResults: Note[]): Promise<string> => {
    if (searchResults.length === 0) {
      return `🤖 搜索完毕，在知识库中未发现与"${query}"直接关联的内容。

💡 **建议：**
• 🔍 尝试使用不同的关键词重新搜索
• 📚 浏览所有知识获取灵感
• ✨ 创建新知识来记录这个主题`;
    }

    const relevantNotes = searchResults.slice(0, 3);
    const summaries = relevantNotes.map((note, index) => {
      const preview = note.content.slice(0, 150).replace(/\n/g, ' ');
      return `📄 **${index + 1}. ${note.title}**\n${preview}${note.content.length > 150 ? '...' : ''}\n`;
    }).join('\n');

    return `🤖 分析完毕，发现 **${searchResults.length}** 个相关的知识节点：

${summaries}

💡 **智能分析：**
针对问题"${query}"，以上知识节点提供了丰富背景信息。

📋 **推荐行动：**
1. 📝 深度阅读：点击相关知识查看完整内容
2. 🔍 扩展搜索：使用相关关键词继续探索
3. ✨ 知识连接：考虑如何将信息与其他知识连接

您还想了解更多内容吗？我随时准备帮助您深入探索！ 💫`;
  };

  const neuralActions = [
    {
      icon: <Search className="w-5 h-5" />,
      title: "智能搜索",
      description: "在知识图谱中智能查找相关内容",
      action: () => {
        setInputValue("帮我搜索关于");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "深度分析",
      description: "获取知识的AI深度分析与见解",
      action: () => {
        setInputValue("分析我的知识结构");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "知识关联",
      description: "发现知识节点间的潜在连接",
      action: () => {
        setInputValue("发现知识间的关联");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    {
      icon: <Plus className="w-5 h-5" />,
      title: "创建知识",
      description: "快速创建新的知识节点",
      action: onNavigateToNotes
    }
  ];

  return (
    <div className="agent-homepage">
      <div className="agent-container">
        
        {!showChat && (
          <motion.div 
            className="welcome-section"
            variants={neuralAnimations.container}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="welcome-header" variants={neuralAnimations.neuralItem}>
                <div className="logo-container">
                  <img 
                    src="./images/logo.png" 
                    alt="Noeton Logo" 
                    className="logo-image"
                    onError={(e) => {
                      // 如果图片加载失败，使用备用文字Logo
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-logo')) {
                        const fallbackLogo = document.createElement('div');
                        fallbackLogo.className = 'fallback-logo brand-logo';
                        fallbackLogo.textContent = 'N';
                        parent.appendChild(fallbackLogo);
                      }
                    }}
                  />
                </div>
              <motion.h1 
                className="welcome-title"
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                Noeton
              </motion.h1>
              <motion.p 
                className="welcome-subtitle"
                variants={neuralAnimations.neuralItem}
              >
                知识管理中心 · 与你的知识进行深度对话
              </motion.p>
            </motion.div>

            <motion.div className="stats-section" variants={neuralAnimations.neuralItem}>
              <div className="stats-grid">
                <motion.div 
                  className="stat-card"
                  whileHover={{ 
                    scale: 1.02,
                    y: -8,
                    transition: { duration: 0.3 }
                  }}
                >
                  <BookOpen className="w-6 h-6" />
                  <div className="stat-content">
                    <div className="stat-number">{notes.length}</div>
                    <div className="stat-label">知识节点</div>
                  </div>
                </motion.div>
                <motion.div 
                  className="stat-card"
                  whileHover={{ 
                    scale: 1.02,
                    y: -8,
                    transition: { duration: 0.3 }
                  }}
                >
                  <Activity className="w-6 h-6" />
                  <div className="stat-content">
                    <div className="stat-number">{messages.length}</div>
                    <div className="stat-label">对话记录</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 神经对话界面 */}
        {showChat && (
          <div className="chat-section">
            <div className="chat-header">
              <div className="chat-title">
                <Brain className="w-5 h-5" />
                <span>Noeton AI 助手</span>
              </div>
              <button 
                className="back-button"
                onClick={() => setShowChat(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </button>
            </div>

            <div className="messages-container">
              <div className="messages-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.role}`}
                  >
                    <div className="message-bubble">
                      <div className="message-content">
                        <p>{message.content}</p>
                        
                        {message.searchResults && message.searchResults.length > 0 && (
                          <div className="search-results">
                            <h5>相关知识节点：</h5>
                            {message.searchResults.map((note) => (
                              <div key={note.id} className="result-item">
                                <BookOpen className="w-4 h-4" />
                                <span>{note.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="message assistant typing">
                    <div className="message-bubble">
                      <div className="typing-indicator">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span className="typing-text">正在思考中...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* 神经输入界面 */}
        <motion.div 
          className="input-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <motion.div 
            className="input-container"
            whileHover={{ 
              scale: 1.01,
              transition: { duration: 0.2 }
            }}
          >
            <motion.input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={showChat ? "继续对话..." : "与 Noeton 开始一次深度对话..."}
              className="chat-input"
              disabled={isLoading}
              whileFocus={{ 
                scale: 1.01,
                transition: { duration: 0.2 }
              }}
            />
            <motion.button
              className={`send-button ${inputValue.trim() ? 'active' : ''}`}
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              whileHover={{
                scale: inputValue.trim() ? 1.05 : 1,
                rotate: inputValue.trim() ? 15 : 0,
                transition: { duration: 0.3 }
              }}
              whileTap={{ 
                scale: 0.95,
                rotate: inputValue.trim() ? 25 : 0
              }}
              animate={inputValue.trim() ? {
                boxShadow: "0 0 30px rgba(102, 126, 234, 0.4)"
              } : {}}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-5 h-5" />
                </motion.div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </motion.div>
          
          <motion.div 
            className="input-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 1 }}
          >
            <span>提示：按 Enter 发送消息，Shift + Enter 换行</span>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};

export default AgentHomepage;