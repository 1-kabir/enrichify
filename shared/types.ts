// shared/types/index.ts

export interface Webset {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  id: string;
  websetId: string;
  url: string;
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SearchProvider {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueJob {
  id: string;
  name: string;
  data: any;
  attemptsMade: number;
  finishedOn?: Date;
  processedOn?: Date;
  progress: number | object;
  failedReason?: string;
  stacktrace?: string[];
  returnvalue?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}