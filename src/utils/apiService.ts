import { WebContent } from '../types';

/**
 * API服务类
 * 负责与后端服务器通信
 */
export class ApiService {
  private static readonly API_BASE_URL = 'https://api.example.com'; // 替换为实际的API地址
  private static readonly API_ENDPOINTS = {
    LEARN: '/api/learn',
    STATUS: '/api/status'
  };

  /**
   * 发送学习数据到服务器
   */
  public static async sendLearningData(content: WebContent): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}${this.API_ENDPOINTS.LEARN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          content,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            source: 'chrome-extension'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Learning data sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send learning data:', error);
      return false;
    }
  }

  /**
   * 检查API连接状态
   */
  public static async checkApiStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}${this.API_ENDPOINTS.STATUS}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('API status check failed:', error);
      return false;
    }
  }

  /**
   * 获取认证令牌
   * 这里可以从Chrome存储中获取用户配置的API密钥
   */
  private static async getAuthToken(): Promise<string> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['apiKey'], (result: { apiKey?: string }) => {
          resolve(result.apiKey || '');
        });
      } else {
        resolve('');
      }
    });
  }

  /**
   * 保存API配置
   */
  public static async saveApiConfig(apiKey: string, baseUrl?: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({
          apiKey,
          apiBaseUrl: baseUrl || this.API_BASE_URL
        }, resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * 获取API配置
   */
  public static async getApiConfig(): Promise<{ apiKey: string; apiBaseUrl: string }> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['apiKey', 'apiBaseUrl'], (result: { apiKey?: string; apiBaseUrl?: string }) => {
          resolve({
            apiKey: result.apiKey || '',
            apiBaseUrl: result.apiBaseUrl || this.API_BASE_URL
          });
        });
      } else {
        resolve({
          apiKey: '',
          apiBaseUrl: this.API_BASE_URL
        });
      }
    });
  }
} 