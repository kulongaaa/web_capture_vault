import { Note } from '../../types';

export interface SearchOptions {
  maxResults?: number;
  includeContent?: boolean;
  fuzzySearch?: boolean;
  titleWeight?: number;
  contentWeight?: number;
}

export interface SearchResult {
  note: Note;
  score: number;
  matchedFields: string[];
  highlights: string[];
}

export class SmartSearchService {
  private stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
    '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没',
    '看', '好', '自己', '这', '那', '能', '可以', '但是', '因为', '所以'
  ]);

  /**
   * 智能搜索知识
   */
  async searchNotes(
    notes: Note[], 
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      maxResults = 10,
      includeContent = true,
      fuzzySearch = true,
      titleWeight = 2.0,
      contentWeight = 1.0
    } = options;

    if (!query.trim()) {
      return [];
    }

    const searchTerms = this.extractSearchTerms(query);
    const results: SearchResult[] = [];

    for (const note of notes) {
      const result = this.scoreNote(note, searchTerms, {
        titleWeight,
        contentWeight,
        includeContent,
        fuzzySearch
      });

      if (result.score > 0) {
        results.push(result);
      }
    }

    // 按相关性排序并限制结果数量
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * 为单个知识评分
   */
  private scoreNote(
    note: Note, 
    searchTerms: string[], 
    options: {
      titleWeight: number;
      contentWeight: number;
      includeContent: boolean;
      fuzzySearch: boolean;
    }
  ): SearchResult {
    let totalScore = 0;
    const matchedFields: string[] = [];
    const highlights: string[] = [];

    // 标题匹配
    const titleScore = this.calculateFieldScore(
      note.title, 
      searchTerms, 
      options.fuzzySearch
    );
    if (titleScore > 0) {
      totalScore += titleScore * options.titleWeight;
      matchedFields.push('title');
      highlights.push(this.createHighlight(note.title, searchTerms));
    }

    // 内容匹配
    if (options.includeContent) {
      const contentScore = this.calculateFieldScore(
        note.content, 
        searchTerms, 
        options.fuzzySearch
      );
      if (contentScore > 0) {
        totalScore += contentScore * options.contentWeight;
        matchedFields.push('content');
        highlights.push(this.createHighlight(note.content, searchTerms, 150));
      }
    }

    // 标签匹配
    const tagText = note.tags.join(' ');
    const tagScore = this.calculateFieldScore(
      tagText, 
      searchTerms, 
      options.fuzzySearch
    );
    if (tagScore > 0) {
      totalScore += tagScore * 1.5; // 标签权重
      matchedFields.push('tags');
    }

    // URL匹配
    if (note.url) {
      const urlScore = this.calculateFieldScore(
        note.url, 
        searchTerms, 
        false // URL不使用模糊搜索
      );
      if (urlScore > 0) {
        totalScore += urlScore * 0.5; // URL权重较低
        matchedFields.push('url');
      }
    }

    return {
      note,
      score: totalScore,
      matchedFields,
      highlights: highlights.filter(h => h.length > 0)
    };
  }

  /**
   * 计算字段匹配分数
   */
  private calculateFieldScore(
    text: string, 
    searchTerms: string[], 
    fuzzySearch: boolean
  ): number {
    if (!text) return 0;

    const normalizedText = text.toLowerCase();
    let score = 0;

    for (const term of searchTerms) {
      const termScore = fuzzySearch 
        ? this.fuzzyMatch(normalizedText, term)
        : this.exactMatch(normalizedText, term);
      
      score += termScore;
    }

    // 短文本匹配加分
    if (text.length < 100 && score > 0) {
      score *= 1.2;
    }

    return score;
  }

  /**
   * 精确匹配
   */
  private exactMatch(text: string, term: string): number {
    const index = text.indexOf(term);
    if (index === -1) return 0;

    // 完整单词匹配加分
    const isCompleteWord = (index === 0 || !/\w/.test(text[index - 1])) &&
      (index + term.length >= text.length || !/\w/.test(text[index + term.length]));
    
    return isCompleteWord ? 2 : 1;
  }

  /**
   * 模糊匹配
   */
  private fuzzyMatch(text: string, term: string): number {
    // 首先尝试精确匹配
    const exactScore = this.exactMatch(text, term);
    if (exactScore > 0) return exactScore;

    // 如果搜索词太短，不进行模糊匹配
    if (term.length < 2) return 0;

    // 检查是否包含搜索词的字符
    let matchCount = 0;
    let lastIndex = -1;

    for (const char of term) {
      const index = text.indexOf(char, lastIndex + 1);
      if (index > lastIndex) {
        matchCount++;
        lastIndex = index;
      }
    }

    // 计算模糊匹配分数
    const matchRatio = matchCount / term.length;
    return matchRatio > 0.6 ? matchRatio * 0.5 : 0;
  }

  /**
   * 创建高亮文本
   */
  private createHighlight(
    text: string, 
    searchTerms: string[], 
    maxLength: number = 100
  ): string {
    if (!text) return '';

    let bestMatch = '';
    let bestScore = 0;

    // 查找最佳匹配片段
    for (const term of searchTerms) {
      const index = text.toLowerCase().indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + term.length + 50);
        const snippet = text.substring(start, end);
        
        if (snippet.length > bestMatch.length) {
          bestMatch = snippet;
          bestScore = term.length;
        }
      }
    }

    if (!bestMatch) {
      // 如果没有找到匹配，返回开头部分
      bestMatch = text.substring(0, maxLength);
    }

    // 限制长度
    if (bestMatch.length > maxLength) {
      bestMatch = bestMatch.substring(0, maxLength) + '...';
    }

    return bestMatch;
  }

  /**
   * 提取搜索词
   */
  private extractSearchTerms(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => 
        term.length > 0 && 
        !this.stopWords.has(term) &&
        term.length > 1
      )
      .slice(0, 10); // 限制搜索词数量
  }

  /**
   * 语义相似度搜索（简化版本）
   */
  async semanticSearch(
    notes: Note[], 
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    // 这里可以集成更高级的语义搜索算法
    // 目前使用改进的关键词匹配
    
    const results = await this.searchNotes(notes, query, {
      ...options,
      fuzzySearch: true
    });

    // 添加语义相关性评分
    return results.map(result => ({
      ...result,
      score: result.score * this.calculateSemanticBonus(result.note, query)
    }));
  }

  /**
   * 计算语义加分
   */
  private calculateSemanticBonus(note: Note, query: string): number {
    // 简化的语义相关性计算
    const queryWords = this.extractSearchTerms(query);
    const noteWords = this.extractSearchTerms(note.title + ' ' + note.content);
    
    const intersection = queryWords.filter(word => 
      noteWords.some(noteWord => 
        noteWord.includes(word) || word.includes(noteWord)
      )
    );
    
    return 1 + (intersection.length / queryWords.length) * 0.5;
  }

  /**
   * 获取相关推荐
   */
  async getRelatedNotes(
    targetNote: Note, 
    allNotes: Note[], 
    maxResults: number = 5
  ): Promise<Note[]> {
    const relatedScores: { note: Note; score: number }[] = [];

    for (const note of allNotes) {
      if (note.id === targetNote.id) continue;

      let score = 0;

      // 标签相似性
      const commonTags = note.tags.filter(tag => 
        targetNote.tags.includes(tag)
      ).length;
      score += commonTags * 2;

      // 标题相似性
      const titleSimilarity = this.calculateTextSimilarity(
        targetNote.title, 
        note.title
      );
      score += titleSimilarity;

      // 内容相似性（采样）
      const contentSimilarity = this.calculateTextSimilarity(
        targetNote.content.substring(0, 300),
        note.content.substring(0, 300)
      ) * 0.5;
      score += contentSimilarity;

      if (score > 0.1) {
        relatedScores.push({ note, score });
      }
    }

    return relatedScores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.note);
  }

  /**
   * 计算文本相似度
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.extractSearchTerms(text1));
    const words2 = new Set(this.extractSearchTerms(text2));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

export default SmartSearchService;