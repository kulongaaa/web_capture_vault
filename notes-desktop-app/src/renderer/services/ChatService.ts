import { Note, ChatMessage, DeepSeekConfig } from '../../types';

export class ChatService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';
    this.model = config.model || 'deepseek-chat';
  }

  /**
   * 更新配置
   */
  updateConfig(config: DeepSeekConfig) {
    this.apiKey = config.apiKey || this.apiKey;
    this.baseUrl = config.baseUrl || this.baseUrl;
    this.model = config.model || this.model;
  }

  /**
   * 发送消息到DeepSeek API
   */
  async sendMessage(
    message: string, 
    searchResults: Note[] = [],
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API Key 未配置');
    }

    try {
      const systemPrompt = this.buildSystemPrompt(searchResults);
      const messages = this.buildMessages(systemPrompt, message, conversationHistory);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.3,
          max_tokens: 2048,
          stream: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API请求失败: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
        );
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('API返回数据格式错误');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('DeepSeek API调用失败:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络设置');
      }
      
      throw error;
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(searchResults: Note[]): string {
    let prompt = `你是一个专业的知识管理助手，名字是"小知"。你的任务是帮助用户管理和查找他们的个人知识知识库。

你的特点：
- 专业、友善、有耐心
- 善于总结和分析信息
- 能够发现知识之间的联系
- 提供实用的建议

请遵循以下原则：
1. 基于用户提供的知识内容进行回答
2. 如果没有相关知识，诚实说明并提供一般性建议
3. 保持回答简洁明了，重点突出
4. 必要时提供结构化的信息整理
5. 鼓励用户探索知识之间的关联`;

    if (searchResults.length > 0) {
      prompt += `\n\n当前用户的相关知识内容：\n`;
      searchResults.forEach((note, index) => {
        const content = note.content.slice(0, 500); // 限制内容长度
        prompt += `\n${index + 1}. 《${note.title}》\n内容摘要：${content}${note.content.length > 500 ? '...' : ''}\n创建时间：${new Date(note.createdAt).toLocaleDateString()}\n`;
      });
    }

    return prompt;
  }

  /**
   * 构建消息数组
   */
  private buildMessages(
    systemPrompt: string, 
    currentMessage: string, 
    conversationHistory: ChatMessage[]
  ) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加最近的对话历史（最多保留最近10轮对话）
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role !== 'user' && msg.role !== 'assistant') continue;
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('DeepSeek连接测试失败:', error);
      return false;
    }
  }

  /**
   * 生成知识总结
   */
  async summarizeNotes(notes: Note[], topic?: string): Promise<string> {
    if (notes.length === 0) {
      return '没有找到相关知识内容。';
    }

    const topicPrompt = topic 
      ? `请围绕"${topic}"这个主题，` 
      : '请';

    const message = `${topicPrompt}对以下知识内容进行总结和分析：

${notes.slice(0, 10).map((note, index) => 
  `${index + 1}. 《${note.title}》\n${note.content.slice(0, 300)}${note.content.length > 300 ? '...' : ''}\n`
).join('\n')}

请提供：
1. 主要知识点总结
2. 重要概念和关键信息
3. 知识之间的关联性
4. 建议的学习或行动计划`;

    return await this.sendMessage(message, notes);
  }

  /**
   * 分析知识关联
   */
  async analyzeKnowledgeConnections(notes: Note[]): Promise<string> {
    if (notes.length < 2) {
      return '需要至少2篇知识才能分析知识关联。';
    }

    const message = `请分析以下知识之间的知识关联和联系：

${notes.slice(0, 8).map((note, index) => 
  `${index + 1}. 《${note.title}》\n主要内容：${note.content.slice(0, 200)}...\n`
).join('\n')}

请从以下角度分析：
1. 主题相关性
2. 概念重叠
3. 逻辑关系
4. 时间关联
5. 知识体系结构
6. 潜在的学习路径建议`;

    return await this.sendMessage(message, notes);
  }
}

export default ChatService;