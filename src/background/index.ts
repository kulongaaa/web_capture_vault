import { ApiService } from '../utils/apiService';
import { 
  LearningRequestMessage, 
  LearningResponseMessage, 
  StatusUpdateMessage,
  OverlayMessage,
  WebContent 
} from '../types';

/**
 * Background Service Worker
 * 负责数据处理、转发、存储和网络请求
 */
class BackgroundService {
  constructor() {
    this.initMessageListeners();
  }

  /**
   * 初始化消息监听器
   */
  private initMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 保持消息通道开放
    });
  }

  /**
   * 处理接收到的消息
   */
  private async handleMessage(
    message: any, 
    sender: any, 
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'LEARNING_REQUEST':
          await this.handleLearningRequest(message as LearningRequestMessage, sender, sendResponse);
          break;
        case 'SHOW_OVERLAY':
        case 'HIDE_OVERLAY':
          await this.handleOverlayMessage(message as OverlayMessage, sender);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ error: errorMessage });
    }
  }

  /**
   * 处理学习请求
   */
  private async handleLearningRequest(
    message: LearningRequestMessage, 
    sender: any, 
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      // 发送状态更新
      await this.sendStatusUpdate(sender.tab?.id, 'learning', '正在处理网页内容...');
      
      let content: WebContent;
      
      // 检查是否已经包含处理好的内容
      if (message.data.content) {
        // 如果popup已经处理好了内容，直接使用
        content = message.data.content;
      } else {
        // 否则请求content script处理页面内容
        content = await this.requestContentProcessing(sender.tab?.id);
      }
      
      // 发送状态更新
      await this.sendStatusUpdate(sender.tab?.id, 'learning', '正在发送数据到服务器...');
      
      // 发送到API
      const success = await ApiService.sendLearningData(content);
      
      if (success) {
        // 发送成功响应
        const response: LearningResponseMessage = {
          type: 'LEARNING_RESPONSE',
          data: content
        };
        sendResponse(response);
        
        // 发送完成状态
        await this.sendStatusUpdate(sender.tab?.id, 'completed', '学习完成！');
      } else {
        throw new Error('API请求失败');
      }
    } catch (error) {
      console.error('Learning request failed:', error);
      
      // 发送错误状态
      await this.sendStatusUpdate(sender.tab?.id, 'error', '处理失败，请重试');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ 
        type: 'LEARNING_RESPONSE', 
        error: errorMessage 
      });
    }
  }

  /**
   * 请求content script处理页面内容
   */
  private async requestContentProcessing(tabId: number | undefined): Promise<WebContent> {
    if (!tabId) {
      throw new Error('无法获取标签页ID');
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: 'PROCESS_PAGE_CONTENT' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || '处理页面内容失败'));
        }
      });
    });
  }

  /**
   * 处理蒙层消息
   */
  private async handleOverlayMessage(message: OverlayMessage, sender: any): Promise<void> {
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, message);
    }
  }

  /**
   * 发送状态更新到content script
   */
  private async sendStatusUpdate(tabId: number | undefined, status: string, message?: string): Promise<void> {
    if (tabId) {
      const statusMessage: StatusUpdateMessage = {
        type: 'STATUS_UPDATE',
        data: {
          status: status as any,
          message
        }
      };
      
      try {
        chrome.tabs.sendMessage(tabId, statusMessage);
      } catch (error) {
        console.warn('Failed to send status update to tab:', error);
      }
    }
  }
}

// 初始化Background服务
new BackgroundService(); 