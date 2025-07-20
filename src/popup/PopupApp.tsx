import React, { useState, useEffect } from 'react';
import { LearningStatus } from '../types';

// 功能卡片组件
const FeatureCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  isActive?: boolean;
  onClick?: () => void;
}> = ({ icon, title, description, isActive = false, onClick }) => {
  return (
    <div 
      className={`feature-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="feature-title">{title}</div>
      <div className="feature-desc">{description}</div>
    </div>
  );
};

// 学习按钮组件
const LearningButton: React.FC<{ 
  onStart: () => void; 
  disabled?: boolean;
  isScanning?: boolean;
}> = ({ onStart, disabled = false, isScanning = false }) => {
  return (
    <button 
      className={`learning-button ${disabled ? 'disabled' : ''} ${isScanning ? 'scanning' : ''}`}
      onClick={onStart}
      disabled={disabled}
    >
      <div className="button-border"></div>
      <span className="button-text">
        {isScanning ? '正在扫描...' : disabled ? '正在学习中...' : '学习此网页知识'}
      </span>
      {isScanning && <div className="scan-progress"></div>}
    </button>
  );
};

// 状态显示组件
const StatusDisplay: React.FC<{ status: LearningStatus; message: string }> = ({ status, message }) => {
  return (
    <div className={`status-display ${status}`}>
      {status === LearningStatus.IDLE && (
        <>
          <span className="status-message">空闲中，准备就绪</span>
        </>
      )}
      {status === LearningStatus.LEARNING && <div className="status-spinner"></div>}
      {status !== LearningStatus.IDLE && <span className="status-message">{message}</span>}
    </div>
  );
};

// 主应用组件
export const PopupApp: React.FC = () => {
  const [status, setStatus] = useState<LearningStatus>(LearningStatus.IDLE);
  const [message, setMessage] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeFeature, setActiveFeature] = useState<string>('learn');

  useEffect(() => {
    console.log('PopupApp mounted');
    // 监听来自background的消息
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message) => {
        console.log('Received message:', message);
        if (message.type === 'STATUS_UPDATE') {
          setStatus(message.data.status);
          setMessage(message.data.message || '');
        }
      });
    }
  }, []);

  // 确保content script已注入
  const ensureContentScriptInjected = async (tabId: number): Promise<boolean> => {
    try {
      // 尝试发送ping消息来检查content script是否已注入
      await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      return true;
    } catch (error) {
      console.log('Content script not injected, injecting now...');
      try {
        // 注入content script
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        });
        
        // 注入CSS
        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['content.css']
        });
        
        // 等待一下让content script初始化
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return true;
      } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
        return false;
      }
    }
  };

  // 开始扫描动画
  const startScanAnimation = async (tabId: number): Promise<void> => {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, {
        type: 'START_SCAN_ANIMATION'
      }, () => {
        // 按钮进度条1.5秒完成，但等待扫描线动画完成
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            type: 'STOP_SCAN_ANIMATION'
          }, resolve);
        }, 2000); // 保持扫描线动画的原有时间
      });
    });
  };

  const handleLearningStart = async () => {
    console.log('Learning start clicked');
    try {
      setStatus(LearningStatus.LEARNING);
      setMessage('正在扫描页面...');
      setIsScanning(true);

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.id) {
          throw new Error('无法获取当前标签页');
        }

        // 确保content script已注入
        const injected = await ensureContentScriptInjected(tab.id);
        if (!injected) {
          throw new Error('无法注入内容脚本');
        }

        // 1. 开始扫描动画
        await startScanAnimation(tab.id);
        
        setMessage('正在处理页面内容...');

        // 2. 处理页面内容
        console.log('Sending message to content script');
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'PROCESS_PAGE_CONTENT'
        });

        console.log('Content script response:', response);

        if (response && response.success && response.data) {
          setMessage('正在发送数据到服务器...');
          
          // 3. 发送学习请求到background
          chrome.runtime.sendMessage({
            type: 'LEARNING_REQUEST',
            data: {
              url: response.data.url,
              content: response.data
            }
          }, (response) => {
            if (response && response.error) {
              setStatus(LearningStatus.ERROR);
              setMessage(response.error);
            }
          });

          // 4. 显示蒙层
          chrome.runtime.sendMessage({
            type: 'SHOW_OVERLAY',
            data: { message: '正在学习该网页...' }
          });
        } else {
          throw new Error('无法获取页面内容');
        }
      } else {
        throw new Error('Chrome API 不可用');
      }
    } catch (error) {
      console.error('Learning start failed:', error);
      setStatus(LearningStatus.ERROR);
      setMessage(error instanceof Error ? error.message : '启动学习失败');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFeatureClick = (feature: string) => {
    setActiveFeature(feature);
    // 这里可以添加不同功能的逻辑
    console.log('Feature clicked:', feature);
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="logo-container">
          <img src="assets/logo.png" alt="Noeton Logo" className="logo-image" />
        </div>
        <h1 className="popup-title">Noeton</h1>
        <p className="popup-subtitle">Turn web into Noeton</p>
        <p className="popup-subtitle">智能学习网页知识并收集，打造专属知识库</p>
      </div>

      <div className="popup-content">
        
        <StatusDisplay status={status} message={message} />
        
        <LearningButton 
          onStart={handleLearningStart}
          disabled={status === LearningStatus.LEARNING}
          isScanning={isScanning}
        />
      </div>
    </div>
  );
}; 