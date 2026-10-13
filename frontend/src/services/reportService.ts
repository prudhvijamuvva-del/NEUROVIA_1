import api from './api';
import { DashboardSummary } from '../types';

export const reportService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await api.get('/dashboard/summary/');
    return res.data;
  },

  async getReportSummary(period: string = '30d') {
    const res = await api.get('/reports/summary/', { params: { period } });
    return res.data;
  },

  async downloadCsv() {
    const response = await api.get('/reports/export-csv/', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BrandShield-Threats-Report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
