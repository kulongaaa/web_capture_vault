import { StatusUpdateMessage, OverlayMessage, LearningStatus } from '../types';
import './content.css';

/**
 * Content Script
 * 负责与页面交互，显示蒙层和状态信息
 */
class ContentScript {
  private overlay: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;

  constructor() {
    this.initMessageListener();
  }

  /**
   * 初始化消息监听器
   */
  private initMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // 保持消息通道开放
    });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: any, sendResponse: (response: any) => void): void {
    switch (message.type) {
      case 'GET_PAGE_CONTENT':
        this.handleGetPageContent(sendResponse);
        break;
      case 'SHOW_OVERLAY':
        this.showOverlay(message.data?.message);
        break;
      case 'HIDE_OVERLAY':
        this.hideOverlay();
        break;
      case 'STATUS_UPDATE':
        this.updateStatus(message as StatusUpdateMessage);
        break;
    }
  }

  /**
   * 处理获取页面内容请求
   */
  private handleGetPageContent(sendResponse: (response: any) => void): void {
    const html = ContentScript.getPageHtml();
    const url = ContentScript.getPageUrl();
    
    sendResponse({
      html,
      url
    });
  }

  /**
   * 显示蒙层
   */
  private showOverlay(message?: string): void {
    if (this.overlay) {
      this.hideOverlay();
    }

    // 创建蒙层元素
    this.overlay = document.createElement('div');
    this.overlay.className = 'web-learning-overlay';
    
    // 创建状态显示元素
    this.statusElement = document.createElement('div');
    this.statusElement.className = 'web-learning-status';
    this.statusElement.innerHTML = `
      <div class="status-content">
        <div class="loading-spinner"></div>
        <div class="status-text">${message || '正在学习该网页...'}</div>
      </div>
    `;

    this.overlay.appendChild(this.statusElement);
    document.body.appendChild(this.overlay);

    // 防止页面滚动
    document.body.style.overflow = 'hidden';
  }

  /**
   * 隐藏蒙层
   */
  private hideOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.statusElement = null;
      
      // 恢复页面滚动
      document.body.style.overflow = '';
    }
  }

  /**
   * 更新状态显示
   */
  private updateStatus(message: StatusUpdateMessage): void {
    const { status, message: statusMessage } = message.data;
    
    if (!this.statusElement) return;

    let statusText = statusMessage || '';
    let statusClass = '';

    switch (status) {
      case LearningStatus.LEARNING:
        statusClass = 'learning';
        statusText = statusText || '正在学习该网页...';
        break;
      case LearningStatus.COMPLETED:
        statusClass = 'completed';
        statusText = statusText || '学习完成！';
        // 3秒后自动隐藏蒙层
        setTimeout(() => this.hideOverlay(), 3000);
        break;
      case LearningStatus.ERROR:
        statusClass = 'error';
        statusText = statusText || '处理失败，请重试';
        // 5秒后自动隐藏蒙层
        setTimeout(() => this.hideOverlay(), 5000);
        break;
    }

    this.statusElement.className = `web-learning-status ${statusClass}`;
    this.statusElement.innerHTML = `
      <div class="status-content">
        ${status === LearningStatus.LEARNING ? '<div class="loading-spinner"></div>' : ''}
        <div class="status-text">${statusText}</div>
        ${status === LearningStatus.COMPLETED ? '<div class="success-icon">✓</div>' : ''}
        ${status === LearningStatus.ERROR ? '<div class="error-icon">✗</div>' : ''}
      </div>
    `;
  }

  /**
   * 获取当前页面的HTML内容
   */
  public static getPageHtml(): string {
    return document.documentElement.outerHTML;
  }

  /**
   * 获取当前页面URL
   */
  public static getPageUrl(): string {
    return window.location.href;
  }
}

// 初始化Content Script
new ContentScript();

// 导出静态方法供popup使用
(window as any).ContentScript = ContentScript; 