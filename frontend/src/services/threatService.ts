import api from './api';
import { Detection, AppNotification } from '../types';

export const threatService = {
  async getDetections(params?: {
    brand_id?: string;
    type?: string;
    severity?: string;
    status?: string;
    q?: string;
  }): Promise<Detection[]> {
    const res = await api.get('/detections/', { params });
    return res.data.results || res.data;
  },

  async getDetection(id: string): Promise<Detection> {
    const res = await api.get(`/detections/${id}/`);
    return res.data;
  },

  async updateDetection(id: string, data: { status?: string; assigned_analyst?: number; resolution_notes?: string }): Promise<Detection> {
    const res = await api.patch(`/detections/${id}/`, data);
    return res.data;
  },

  async addNote(detectionId: string, noteText: string) {
    const res = await api.post(`/detections/${detectionId}/notes/`, { note_text: noteText });
    return res.data;
  },

  async getNotifications(): Promise<AppNotification[]> {
    const res = await api.get('/notifications/');
    return res.data.results || res.data;
  },

  async markAllNotificationsRead() {
    const res = await api.post('/notifications/read-all/');
    return res.data;
  },

  async getAuditLogs() {
    const res = await api.get('/audit-logs/');
    return res.data.results || res.data;
  }
};
