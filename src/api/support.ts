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

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  orderId?: string;
  createdAt: string;
}

export const supportApi = {
  /** Get support message thread */
  getMessages: (): Promise<ApiResponse<ChatMessageItem[]>> =>
    client.get('/api/support/messages'),

  /** Send support message */
  sendMessage: (text: string): Promise<ApiResponse<ChatMessageItem>> =>
    client.post('/api/support/messages', { text }),

  /** Fetch notification list */
  getNotifications: (): Promise<ApiResponse<NotificationItem[]>> =>
    client.get('/api/notifications'),

  /** Mark single notification as read */
  markNotificationRead: (id: string): Promise<ApiResponse<null>> =>
    client.put(`/api/notifications/${id}/read`),

  /** Mark all notifications as read */
  markAllNotificationsRead: (): Promise<ApiResponse<null>> =>
    client.put('/api/notifications/read-all'),
};
