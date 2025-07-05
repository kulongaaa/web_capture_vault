// 网页内容提取结果类型
export interface WebContent {
  title: string;
  text: string;
  images: string[];
  url: string;
  timestamp: number;
}

// 学习状态类型
export enum LearningStatus {
  IDLE = 'idle',
  LEARNING = 'learning',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// 消息类型
export interface Message {
  type: string;
  data?: any;
  error?: string;
}

// 学习请求消息
export interface LearningRequestMessage extends Message {
  type: 'LEARNING_REQUEST';
  data: {
    url: string;
    html: string;
  };
}

// 学习响应消息
export interface LearningResponseMessage extends Message {
  type: 'LEARNING_RESPONSE';
  data: WebContent;
}

// 状态更新消息
export interface StatusUpdateMessage extends Message {
  type: 'STATUS_UPDATE';
  data: {
    status: LearningStatus;
    message?: string;
  };
}

// 蒙层控制消息
export interface OverlayMessage extends Message {
  type: 'SHOW_OVERLAY' | 'HIDE_OVERLAY';
  data?: {
    message?: string;
  };
} 