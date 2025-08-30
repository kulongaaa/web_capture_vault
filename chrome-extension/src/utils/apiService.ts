import { WebContent } from '../types';

/**
 * API服务类
 * 负责与本地桌面应用通信
 */
export class ApiService {
  private static readonly DEFAULT_LOCAL_URL = 'http://127.0.0.1:3001'; // 本地桌面应用地址
  private static readonly FALLBACK_API_URL = 'https://api.example.com'; // 备用云端API地址
  private static readonly API_ENDPOINTS = {
    // 本地桌面应用接口
    LOCAL_NOTES: '/api/notes',
    LOCAL_HEALTH: '/health',
    // 云端接口（备用）
    CLOUD_LEARN: '/api/learn',
    CLOUD_STATUS: '/api/status'
  };

  /**
   * 发送网页内容到本地笔记应用
   */
  public static async sendWebContentToNotes(webContent: WebContent): Promise<boolean> {
    try {
      // 首先尝试连接本地桌面应用
      const localSuccess = await this.sendToLocalApp(webContent);
      if (localSuccess) {
        console.log('网页内容已成功发送到本地笔记应用');
        return true;
      }

      // 如果本地应用不可用，尝试云端备用服务
      console.log('本地应用不可用，尝试云端服务...');
      const cloudSuccess = await this.sendToCloudService(webContent);
      return cloudSuccess;
    } catch (error) {
      console.error('发送网页内容失败:', error);
      return false;
    }
  }

  /**
   * 发送到本地桌面应用
   */
  private static async sendToLocalApp(webContent: WebContent): Promise<boolean> {
    try {
      const config = await this.getApiConfig();
      const localUrl = config.localUrl || this.DEFAULT_LOCAL_URL;
      
      // 构造笔记数据
      const noteData = {
        title: webContent.title || '未命名网页',
        content: this.formatWebContentAsMarkdown(webContent),
        url: webContent.url,
        tags: ['网页收集', '浏览器插件'],
        metadata: {
          source: 'chrome-extension',
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          originalTitle: webContent.title,
          extractedImages: webContent.images?.length || 0
        }
      };

      const response = await fetch(`${localUrl}${this.API_ENDPOINTS.LOCAL_NOTES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Token': 'local-notes-app-token' // 简单的本地验证
        },
        body: JSON.stringify(noteData)
      });

      if (!response.ok) {
        throw new Error(`本地应用响应错误: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log('笔记已保存到本地应用:', result.data);
        return true;
      } else {
        throw new Error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('发送到本地应用失败:', error);
      return false;
    }
  }

  /**
   * 发送到云端服务（备用）
   */
  private static async sendToCloudService(webContent: WebContent): Promise<boolean> {
    try {
      const config = await this.getApiConfig();
      const cloudUrl = config.cloudUrl || this.FALLBACK_API_URL;
      
      const response = await fetch(`${cloudUrl}${this.API_ENDPOINTS.CLOUD_LEARN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          content: this.formatWebContentAsMarkdown(webContent),
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            source: 'chrome-extension',
            url: webContent.url,
            title: webContent.title
          }
        })
      });

      if (!response.ok) {
        throw new Error(`云端服务响应错误: ${response.status}`);
      }

      const result = await response.json();
      console.log('内容已发送到云端服务:', result);
      return true;
    } catch (error) {
      console.error('发送到云端服务失败:', error);
      return false;
    }
  }

  /**
   * 将网页内容格式化为Markdown
   */
  private static formatWebContentAsMarkdown(webContent: WebContent): string {
    let markdown = '';
    
    // 添加标题
    if (webContent.title) {
      markdown += `# ${webContent.title}\n\n`;
    }
    
    // 添加来源链接
    if (webContent.url) {
      markdown += `**来源**: [${webContent.url}](${webContent.url})\n\n`;
    }
    
    // 添加采集时间
    const collectTime = new Date().toLocaleString('zh-CN');
    markdown += `**采集时间**: ${collectTime}\n\n`;
    
    // 添加内容
    if (webContent.text) {
      markdown += `## 正文内容\n\n${webContent.text}\n\n`;
    }
    
    // 添加图片（如果有）
    if (webContent.images && webContent.images.length > 0) {
      markdown += `## 相关图片\n\n`;
      webContent.images.slice(0, 10).forEach((img, index) => {
        markdown += `![图片${index + 1}](${img})\n\n`;
      });
      
      if (webContent.images.length > 10) {
        markdown += `*还有 ${webContent.images.length - 10} 张图片未显示*\n\n`;
      }
    }
    
    // 添加Markdown格式的元数据
    if (webContent.markdown) {
      markdown += `## 原始Markdown\n\n${webContent.markdown}\n\n`;
    }
    
    return markdown;
  }

  /**
   * 检查本地桌面应用连接状态
   */
  public static async checkLocalAppStatus(): Promise<{ 
    available: boolean; 
    version?: string; 
    error?: string 
  }> {
    try {
      const config = await this.getApiConfig();
      const localUrl = config.localUrl || this.DEFAULT_LOCAL_URL;
      
      const response = await fetch(`${localUrl}${this.API_ENDPOINTS.LOCAL_HEALTH}`, {
        method: 'GET',
        timeout: 3000 // 3秒超时
      } as any);

      if (response.ok) {
        const result = await response.json();
        return {
          available: true,
          version: result.data?.version
        };
      } else {
        return {
          available: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        available: false,
        error: (error as any).message || '连接失败'
      };
    }
  }

  /**
   * 检查云端API连接状态（备用）
   */
  public static async checkCloudApiStatus(): Promise<boolean> {
    try {
      const config = await this.getApiConfig();
      const cloudUrl = config.cloudUrl || this.FALLBACK_API_URL;
      
      const response = await fetch(`${cloudUrl}${this.API_ENDPOINTS.CLOUD_STATUS}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('云端API状态检查失败:', error);
      return false;
    }
  }

  /**
   * 获取认证令牌（保持向后兼容）
   */
  private static async getAuthToken(): Promise<string> {
    const config = await this.getApiConfig();
    return config.apiKey;
  }

  /**
   * 保存API配置
   */
  public static async saveApiConfig(
    apiKey: string, 
    localUrl?: string, 
    cloudUrl?: string
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({
          apiKey,
          localUrl: localUrl || this.DEFAULT_LOCAL_URL,
          cloudUrl: cloudUrl || this.FALLBACK_API_URL
        }, resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * 获取API配置
   */
  public static async getApiConfig(): Promise<{ 
    apiKey: string; 
    localUrl: string; 
    cloudUrl: string;
    // 保持向后兼容
    apiBaseUrl: string;
  }> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(
          ['apiKey', 'localUrl', 'cloudUrl', 'apiBaseUrl'], 
          (result: { 
            apiKey?: string; 
            localUrl?: string; 
            cloudUrl?: string;
            apiBaseUrl?: string;
          }) => {
            const config = {
              apiKey: result.apiKey || '',
              localUrl: result.localUrl || this.DEFAULT_LOCAL_URL,
              cloudUrl: result.cloudUrl || this.FALLBACK_API_URL,
              // 保持向后兼容
              apiBaseUrl: result.apiBaseUrl || result.cloudUrl || this.FALLBACK_API_URL
            };
            resolve(config);
          }
        );
      } else {
        resolve({
          apiKey: '',
          localUrl: this.DEFAULT_LOCAL_URL,
          cloudUrl: this.FALLBACK_API_URL,
          apiBaseUrl: this.FALLBACK_API_URL
        });
      }
    });
  }

  /**
   * 兼容旧版本的发送学习数据方法
   * @deprecated 请使用 sendWebContentToNotes 方法
   */
  public static async sendLearningData(content: string): Promise<boolean> {
    console.warn('sendLearningData 方法已废弃，请使用 sendWebContentToNotes 方法');
    
    // 尝试将字符串内容转换为WebContent格式
    const webContent: WebContent = {
      title: '采集的内容',
      text: content,
      images: [],
      url: '',
      timestamp: Date.now()
    };
    
    return this.sendWebContentToNotes(webContent);
  }
} 