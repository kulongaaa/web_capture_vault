import React, { useState, useEffect } from 'react';
import { LearningButton } from './components/LearningButton';
import { StatusDisplay } from './components/StatusDisplay';
import { SettingsPanel } from './components/SettingsPanel';
import { LearningStatus } from '../types';

export const PopupApp: React.FC = () => {
  const [status, setStatus] = useState<LearningStatus>(LearningStatus.IDLE);
  const [message, setMessage] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'STATUS_UPDATE') {
        setStatus(message.data.status);
        setMessage(message.data.message || '');
      }
    });
  }, []);

  const handleLearningStart = async () => {
    try {
      setStatus(LearningStatus.LEARNING);
      setMessage('正在获取页面内容...');

      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('无法获取当前标签页');
      }

      // 向content script发送消息，获取页面HTML
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_PAGE_CONTENT'
      });

      if (response && response.html) {
        // 发送学习请求到background
        chrome.runtime.sendMessage({
          type: 'LEARNING_REQUEST',
          data: {
            url: response.url,
            html: response.html
          }
        }, (response) => {
          if (response && response.error) {
            setStatus(LearningStatus.ERROR);
            setMessage(response.error);
          }
        });

        // 显示蒙层
        chrome.runtime.sendMessage({
          type: 'SHOW_OVERLAY',
          data: { message: '正在学习该网页...' }
        });
      } else {
        throw new Error('无法获取页面内容');
      }
    } catch (error) {
      console.error('Learning start failed:', error);
      setStatus(LearningStatus.ERROR);
      setMessage(error instanceof Error ? error.message : '启动学习失败');
    }
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1 className="popup-title">网页学习助手</h1>
        <button 
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
          title="设置"
        >
          ⚙️
        </button>
      </div>

      <div className="popup-content">
        {showSettings ? (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        ) : (
          <>
            <StatusDisplay status={status} message={message} />
            <LearningButton 
              onStart={handleLearningStart}
              disabled={status === LearningStatus.LEARNING}
            />
          </>
        )}
      </div>
    </div>
  );
}; 