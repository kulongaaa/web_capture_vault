import React, { useState, useEffect } from 'react';
import { ApiService } from '../../utils/apiService';

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 加载当前配置
    const loadConfig = async () => {
      const config = await ApiService.getApiConfig();
      setApiKey(config.apiKey);
      setApiBaseUrl(config.apiBaseUrl);
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await ApiService.saveApiConfig(apiKey, apiBaseUrl);
      alert('设置已保存');
      onClose();
    } catch (error) {
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>设置</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="settings-content">
        <div className="setting-item">
          <label htmlFor="apiKey">API密钥:</label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入API密钥"
          />
        </div>
        
        <div className="setting-item">
          <label htmlFor="apiBaseUrl">API地址:</label>
          <input
            id="apiBaseUrl"
            type="url"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder="https://api.example.com"
          />
        </div>
        
        <div className="settings-actions">
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}; 