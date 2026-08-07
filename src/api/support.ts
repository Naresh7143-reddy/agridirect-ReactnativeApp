import client from './client';
import type { ApiResponse } from '../types/api';

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
}

export const supportApi = {
  /** Get support message thread */
  getMessages: (): Promise<ApiResponse<ChatMessageItem[]>> =>
    client.get('/api/support/messages'),

  /** Send support message */
  sendMessage: (text: string): Promise<ApiResponse<ChatMessageItem>> =>
    client.post('/api/support/messages', { text }),
};
