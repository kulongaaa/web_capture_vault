import { StatusUpdateMessage, OverlayMessage, LearningStatus, WebContent } from '../types';
import './content.css';

/**
 * Content Script
 * 负责与页面交互，显示蒙层和状态信息，处理DOM内容
 */
class ContentScript {
  private overlay: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;
  private scanAnimation: HTMLElement | null = null;

  // 需要移除的选择器
  private static readonly REMOVE_SELECTORS = [
    'script',
    'style',
    'noscript',
    'iframe',
    'embed',
    'object',
    'applet',
    'canvas',
    'svg',
    'nav',
    'header',
    'footer',
    'aside',
    'menu',
    'menuitem',
    'dialog',
    'details',
    'summary',
    '[style*="display: none"]',
    '[style*="display:none"]',
    '.ad',
    '.advertisement',
    '.ads',
    '.banner',
    '.sidebar',
    '.navigation',
    '.menu',
    '.footer',
    '.header',
    '.comment',
    '.comments',
    '.social',
    '.share',
    '.related',
    '.recommendation'
  ];

  constructor() {
    this.initMessageListener();
    this.initScanAnimationStyles();
  }

  /**
   * 初始化扫描动画样式
   */
  private initScanAnimationStyles(): void {
    if (!document.getElementById('scan-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'scan-animation-styles';
      style.textContent = `
        .web-learning-scan-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 999999;
          overflow: hidden;
        }
        
        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            #667eea 20%, 
            #764ba2 50%, 
            #667eea 80%, 
            transparent 100%
          );
          box-shadow: 
            0 0 10px rgba(102, 126, 234, 0.8),
            0 0 20px rgba(118, 75, 162, 0.6),
            0 0 30px rgba(102, 126, 234, 0.4);
          animation: scan-sweep 2s ease-in-out;
        }
        
        .scan-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .scan-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #667eea;
          border-radius: 50%;
          animation: scan-particle-fall 2s ease-in-out infinite;
        }
        
        @keyframes scan-sweep {
          0% {
            transform: translateY(-2px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        
        @keyframes scan-particle-fall {
          0% {
            transform: translateY(-10px) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) scale(1);
            opacity: 0;
          }
        }
        
        .scan-highlight {
          position: absolute;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 4px;
          animation: scan-highlight-pulse 2s ease-in-out;
        }
        
        @keyframes scan-highlight-pulse {
          0%, 100% {
            opacity: 0;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
      `;
      document.head.appendChild(style);
    }
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
      case 'PING':
        // 响应ping消息，表示content script已注入
        sendResponse({ success: true, message: 'Content script is ready' });
        break;
      case 'GET_PAGE_CONTENT':
        this.handleGetPageContent(sendResponse);
        break;
      case 'PROCESS_PAGE_CONTENT':
        this.handleProcessPageContent(sendResponse);
        break;
      case 'START_SCAN_ANIMATION':
        this.startScanAnimation();
        sendResponse({ success: true });
        break;
      case 'STOP_SCAN_ANIMATION':
        this.stopScanAnimation();
        sendResponse({ success: true });
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
   * 开始扫描动画
   */
  private startScanAnimation(): void {
    this.stopScanAnimation(); // 确保之前的动画已停止

    // 创建扫描动画容器
    this.scanAnimation = document.createElement('div');
    this.scanAnimation.className = 'web-learning-scan-animation';

    // 创建扫描线
    const scanLine = document.createElement('div');
    scanLine.className = 'scan-line';
    this.scanAnimation.appendChild(scanLine);

    // 创建粒子效果
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'scan-particles';
    
    // 添加多个粒子
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'scan-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 2 + 's';
      particle.style.animationDuration = (1.5 + Math.random()) + 's';
      particlesContainer.appendChild(particle);
    }
    
    this.scanAnimation.appendChild(particlesContainer);

    // 添加高亮效果
    this.addScanHighlights();

    // 添加到页面
    document.body.appendChild(this.scanAnimation);

    // 2秒后自动停止
    setTimeout(() => {
      this.stopScanAnimation();
    }, 2000);
  }

  /**
   * 停止扫描动画
   */
  private stopScanAnimation(): void {
    if (this.scanAnimation) {
      this.scanAnimation.remove();
      this.scanAnimation = null;
    }
    
    // 移除高亮效果
    const highlights = document.querySelectorAll('.scan-highlight');
    highlights.forEach(el => el.remove());
  }

  /**
   * 添加扫描高亮效果
   */
  private addScanHighlights(): void {
    // 选择一些重要的元素进行高亮
    const importantElements = document.querySelectorAll('h1, h2, h3, p, img, .content, .main, article, section');
    
    importantElements.forEach((el, index) => {
      if (index < 10) { // 限制高亮元素数量
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const highlight = document.createElement('div');
          highlight.className = 'scan-highlight';
          highlight.style.left = rect.left + 'px';
          highlight.style.top = rect.top + 'px';
          highlight.style.width = rect.width + 'px';
          highlight.style.height = rect.height + 'px';
          highlight.style.animationDelay = (index * 0.1) + 's';
          
          document.body.appendChild(highlight);
          
          // 动画结束后移除
          setTimeout(() => {
            if (highlight.parentNode) {
              highlight.remove();
            }
          }, 2000);
        }
      }
    });
  }

  /**
   * 处理获取页面内容请求（保持向后兼容）
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
   * 处理页面内容并提取结构化数据
   */
  private async handleProcessPageContent(sendResponse: (response: any) => void): Promise<void> {
    try {
      const url = ContentScript.getPageUrl();
      // 如果是飞书文档页面，自动滚动并收集所有 block 并转为 markdown
      if (url.includes('feishu')) {
        if (document.querySelector('#mainBox .bear-web-x-container')) {
          const { markdown, blocks } = await ContentScript.collectAllBlocksMarkdownWithScroll(url);
          // 兼容 WebContent 类型，补全字段
          sendResponse({ success: true, data: { title: '', text: '', images: [], url, timestamp: Date.now(), markdown, blocks } });
          return;
        }
      }
      // 否则走普通网页逻辑
      await ContentScript.scrollToBottom();
      const content = ContentScript.processPageContent(url);
      const orderedContent = ContentScript.extractContentWithOrder(document.body, url);
      const markdown = ContentScript.contentToMarkdown(orderedContent);
      // 优化markdown
      const optimizedMarkdown = await ContentScript.optimizeMarkdownWithDeepSeek(markdown);
      console.log("optimizedMarkdown", optimizedMarkdown);
      sendResponse({ success: true, data: { ...content, markdown: optimizedMarkdown } });
    } catch (error) {
      console.error('Failed to process page content:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * 处理页面内容，提取文本和图片
   */
  public static processPageContent(url: string): WebContent {
    // 直接使用原始document，不用clone
    const doc = document;
    
    // 清理无用元素
    ContentScript.removeUnwantedElements(doc);
    
    // 提取标题
    const title = ContentScript.extractTitle(doc);
    
    // 提取文本内容
    const text = ContentScript.extractText(doc);
    
    // 提取图片
    const images = ContentScript.extractImages(doc, url);
    
    return {
      title,
      text,
      images,
      url,
      timestamp: Date.now()
    };
  }

  /**
   * 移除无用的HTML元素
   */
  private static removeUnwantedElements(doc: Document): void {
    this.REMOVE_SELECTORS.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }

  /**
   * 提取页面标题
   */
  private static extractTitle(doc: Document): string {
    const titleElement = doc.querySelector('title');
    if (titleElement) {
      return titleElement.textContent?.trim() || '';
    }
    
    const h1Element = doc.querySelector('h1');
    if (h1Element) {
      return h1Element.textContent?.trim() || '';
    }
    
    return '无标题';
  }

  /**
   * 提取文本内容
   */
  private static extractText(doc: Document): string {
    const body = doc.body;
    if (!body) return '';

    // 移除脚本和样式元素
    const scripts = body.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());

    // 获取所有文本节点
    const textNodes: string[] = [];
    const walker = document.createTreeWalker(
      body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          if (text && text.length > 0) {
            // 过滤掉只包含空白字符的节点
            if (/\S/.test(text)) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text) {
        textNodes.push(text);
      }
    }

    // 合并文本并清理
    let fullText = textNodes.join(' ');
    
    // 移除多余的空白字符
    fullText = fullText.replace(/\s+/g, ' ');
    
    // 移除特殊字符
    fullText = fullText.replace(/[\r\n\t]/g, ' ');
    
    return fullText.trim();
  }

  /**
   * 提取飞书文档图片URL（严格匹配docx-image-block结构）
   */
  private static extractImages(doc: Document, baseUrl: string): string[] {
    const images: string[] = [];
    const seenIds = new Set<string>();
    
    // 查找所有严格匹配的docx-image-block
    const blocks = doc.querySelectorAll('div.block.docx-image-block[data-block-type="image"]');
    console.log('Found blocks:', blocks.length);
    
    blocks.forEach((block, index) => {
      // 获取block-id作为唯一标识
      const blockId = block.getAttribute('data-block-id');
      const recordId = block.getAttribute('data-record-id');
      const uniqueId = blockId || recordId;
      
      console.log(`Block ${index}:`, { blockId, recordId, uniqueId });
      
      if (!uniqueId || seenIds.has(uniqueId)) {
        console.log(`Skipping block ${index}: duplicate or no id`);
        return;
      }
      
      seenIds.add(uniqueId);
      
      // 在block内查找img元素
      const img = block.querySelector('img');
      if (img) {
        let imageUrl = img.getAttribute('src');
        console.log(`Block ${index} img src:`, imageUrl);
        
        if (imageUrl) {
          // 处理相对URL
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            const urlObj = new URL(baseUrl);
            imageUrl = urlObj.origin + imageUrl;
          } else if (!imageUrl.startsWith('http')) {
            imageUrl = new URL(imageUrl, baseUrl).href;
          }
          
          images.push(imageUrl);
          console.log(`Added image URL:`, imageUrl);
        }
      } else {
        console.log(`Block ${index}: no img found`);
      }
    });
    
    console.log('Final images array:', images);
    return images;
  }

  /**
   * 自动滚动并动态收集所有 block，滚动结束后返回完整的 Markdown
   */
  public static async collectAllBlocksMarkdownWithScroll(baseUrl: string): Promise<{ markdown: string, blocks: Element[] }> {
    const scrollContainer = document.querySelector('#mainBox .bear-web-x-container') as HTMLElement;
    if (!scrollContainer) {
      console.error('未找到滚动容器');
      return { markdown: '', blocks: [] };
    }
    const stepSize = 50;
    const interval = 10;
    let currentScrollTop = scrollContainer.scrollTop;
    const allBlocks: Element[] = [];
    const seenBlockIds = new Set<string>();

    function collectBlocks() {
      const blocks = document.querySelectorAll('.block[data-block-id]');
      blocks.forEach(block => {
        const blockId = block.getAttribute('data-block-id');
        if (blockId && !seenBlockIds.has(blockId)) {
          seenBlockIds.add(blockId);
          allBlocks.push(block);
        }
      });
    }

    return new Promise<{ markdown: string, blocks: Element[] }>((resolve) => {
      function scrollStep() {
        collectBlocks();
        currentScrollTop += stepSize;
        scrollContainer.scrollTo({ top: currentScrollTop, behavior: 'smooth' });
        if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 2) {
          setTimeout(() => {
            collectBlocks(); // 最后再收集一次
            const markdown = ContentScript.blocksToMarkdown(allBlocks, baseUrl);
            resolve({ markdown, blocks: allBlocks });
          }, 500);
          return;
        }
        setTimeout(scrollStep, interval);
      }
      scrollStep();
    });
  }

  private static blocksToMarkdown(blocks: Element[], baseUrl: string): string {
    let md = '';
    for (const block of blocks) {
      const type = block.getAttribute('data-block-type');
      switch (type) {
        case 'text':
          md += ContentScript.parseTextBlock(block) + '\n\n';
          break;
        case 'heading1':
          md += '# ' + ContentScript.parseTextBlock(block) + '\n\n';
          break;
        case 'heading2':
          md += '## ' + ContentScript.parseTextBlock(block) + '\n\n';
          break;
        case 'heading3':
          md += '### ' + ContentScript.parseTextBlock(block) + '\n\n';
          break;
        case 'image':
          md += ContentScript.parseImageBlock(block, baseUrl) + '\n\n';
          break;
        case 'bullet':
          md += ContentScript.parseBulletBlock(block) + '\n';
          break;
        case 'quote_container':
          md += ContentScript.parseQuoteBlock(block, baseUrl) + '\n\n';
          break;
        default:
          break;
      }
    }
    console.log("md", md);
    return md.trim();
  }

  private static parseTextBlock(block: Element): string {
    return block.textContent?.replace(/\u200b/g, '').trim() || '';
  }

  private static parseImageBlock(block: Element, baseUrl: string): string {
    const img = block.querySelector('img');
    if (img) {
      let src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      if (src.startsWith('//')) {
        src = 'https:' + src;
      } else if (src.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        src = urlObj.origin + src;
      } else if (!src.startsWith('http')) {
        src = new URL(src, baseUrl).href;
      }
      return `![${alt}](${src})`;
    }
    return '';
  }

  private static parseBulletBlock(block: Element): string {
    return '- ' + block.textContent?.replace(/\u200b/g, '').trim();
  }

  private static parseQuoteBlock(block: Element, baseUrl: string): string {
    const children = block.querySelectorAll('.block[data-block-id]');
    let quoteMd = '';
    children.forEach(child => {
      quoteMd += '> ' + ContentScript.parseTextBlock(child) + '\n';
    });
    return quoteMd;
  }

  // 自动滑动到底部，确保懒加载内容加载完成
  private static async scrollToBottom(): Promise<void> {
    return new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          setTimeout(resolve, 500); // 等待懒加载
        }
      }, 100);
    });
  }

  // 按 DOM 顺序提取文本和图片
  private static extractContentWithOrder(root: HTMLElement, baseUrl: string): Array<{ type: 'text' | 'image', content: string, alt?: string }> {
    const result: Array<{ type: 'text' | 'image', content: string, alt?: string }> = [];
    function walk(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.replace(/\u200b/g, '').trim();
        if (text && text.length > 0) {
          result.push({ type: 'text', content: text });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName.toLowerCase() === 'img') {
          let src = el.getAttribute('src') || '';
          const alt = el.getAttribute('alt') || '';
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(baseUrl);
            src = urlObj.origin + src;
          } else if (!src.startsWith('http')) {
            src = new URL(src, baseUrl).href;
          }
          result.push({ type: 'image', content: src, alt });
        } else {
          // 跳过 script/style/noscript/iframe 等无关元素
          const skipTags = ['script', 'style', 'noscript', 'iframe', 'canvas', 'svg', 'footer', 'header', 'nav', 'aside'];
          if (!skipTags.includes(el.tagName.toLowerCase())) {
            for (let child = node.firstChild; child; child = child.nextSibling) {
              walk(child);
            }
          }
        }
      }
    }
    walk(root);
    return result;
  }

  // 将内容数组转为 markdown
  private static contentToMarkdown(contentArr: Array<{ type: 'text' | 'image', content: string, alt?: string }>): string {
    let md = '';
    for (const item of contentArr) {
      if (item.type === 'text') {
        md += item.content + '\n\n';
      } else if (item.type === 'image') {
        md += `![${item.alt || ''}](${item.content})\n\n`;
      }
    }
    return md.trim();
  }

  // 调用DeepSeek API优化markdown
  private static async optimizeMarkdownWithDeepSeek(markdown: string): Promise<string> {
    const apiKey = 'API_KEY';
    const endpoint = 'https://api.deepseek.com/v1/chat/completions';
    const prompt = `你将收到一份由网页技术知识博客内容清洗得到的 markdown 文档，但其中仍可能包含以下问题：\n\n- 无关的广告内容\n- 多余的导航、侧边栏、页脚等无关信息\n- 冗余的图片（如广告图、装饰图、无意义的 banner 等）\n- 多余或杂乱的换行、空行\n- 其他与正文无关的内容\n\n请你作为一名专业的内容整理助手，帮我进一步清洗和优化这份 markdown，具体要求如下：\n\n1. 去除所有与正文无关的内容，如广告、导航、页脚、侧边栏、推荐、评论、分享等。\n2. 只保留与技术知识相关的正文内容，包括标题、正文、代码块、关键图片（如与技术内容直接相关的示意图、流程图等）。\n3. 删除冗余的图片，只保留对理解正文有帮助的图片，并去除无意义的图片。\n4. 整理段落结构，合并多余的空行，保持 markdown 格式清晰、简洁。\n5. 如有必要，对内容进行适当的总结和归纳，使其更易于理解和复用。\n6. 输出一份干净、结构清晰的 markdown 文档，不包含任何与正文无关的内容。\n\n请严格按照上述要求处理输入的 markdown，并只输出最终优化后的 markdown 内容。`;
    const messages = [
      { role: 'system', content: prompt },
      { role: 'user', content: markdown }
    ];
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
      })
    });
    if (!res.ok) throw new Error('DeepSeek API error: ' + res.statusText);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
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