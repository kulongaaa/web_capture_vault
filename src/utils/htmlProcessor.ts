import { WebContent } from '../types';

/**
 * HTML内容处理器
 * 负责提取网页中的文本和图片，移除无用元素
 */
export class HtmlProcessor {
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

  /**
   * 处理HTML内容，提取文本和图片
   */
  public static processHtml(html: string, url: string): WebContent {
    // 创建临时DOM元素
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 清理无用元素
    this.removeUnwantedElements(doc);
    
    // 提取标题
    const title = this.extractTitle(doc);
    
    // 提取文本内容
    const text = this.extractText(doc);
    
    // 提取图片
    const images = this.extractImages(doc, url);
    
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
   * 提取图片URL
   */
  private static extractImages(doc: Document, baseUrl: string): string[] {
    const images: string[] = [];
    const imgElements = doc.querySelectorAll('img');
    
    imgElements.forEach(img => {
      const src = img.getAttribute('src');
      const dataSrc = img.getAttribute('data-src');
      const srcset = img.getAttribute('srcset');
      
      let imageUrl = src || dataSrc;
      
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
        
        // 过滤掉小图标和装饰性图片
        const width = img.getAttribute('width');
        const height = img.getAttribute('height');
        const alt = img.getAttribute('alt') || '';
        
        // 如果图片太小或者是图标，则跳过
        if (width && parseInt(width) < 50) return;
        if (height && parseInt(height) < 50) return;
        if (alt.toLowerCase().includes('icon')) return;
        
        images.push(imageUrl);
      }
    });
    
    // 去重并返回
    return [...new Set(images)];
  }
} 