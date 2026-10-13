import api from './api';
import { DataSource, ScanJob } from '../types';

export const monitoringService = {
  async getSocialCandidates(brandId?: string) {
    const res = await api.get('/monitoring/social/', { params: { brand_id: brandId } });
    return res.data.results || res.data;
  },

  async triggerSocialScan(brandId?: string) {
    const res = await api.post('/monitoring/social/scan/', { brand_id: brandId });
    return res.data;
  },

  async getAppCandidates(brandId?: string) {
    const res = await api.get('/monitoring/apps/', { params: { brand_id: brandId } });
    return res.data.results || res.data;
  },

  async triggerAppScan(brandId?: string) {
    const res = await api.post('/monitoring/apps/scan/', { brand_id: brandId });
    return res.data;
  },

  async getDataSources(): Promise<DataSource[]> {
    const res = await api.get('/monitoring/sources/');
    return res.data;
  },

  async updateDataSource(id: number, data: Partial<DataSource>): Promise<DataSource> {
    const res = await api.patch(`/monitoring/sources/${id}/`, data);
    return res.data;
  },

  async importCandidates(brandId: string, importType: 'SOCIAL' | 'APP_STORE', records: any[]) {
    const res = await api.post('/monitoring/import/', { brand_id: brandId, import_type: importType, records });
    return res.data;
  },

  async submitCandidate(data: any) {
    const res = await api.post('/monitoring/submit-candidate/', data);
    return res.data;
  },

  async getScans(brandId?: string): Promise<ScanJob[]> {
    const res = await api.get('/monitoring/scans/', { params: { brand_id: brandId } });
    return res.data.results || res.data;
  }
};
