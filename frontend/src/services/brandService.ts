import api from './api';
import { Brand, OfficialAsset } from '../types';

export const brandService = {
  async getBrands(): Promise<Brand[]> {
    const res = await api.get('/brands/');
    return res.data.results || res.data;
  },

  async getBrand(id: string): Promise<Brand> {
    const res = await api.get(`/brands/${id}/`);
    return res.data;
  },

  async createBrand(data: Partial<Brand>): Promise<Brand> {
    const res = await api.post('/brands/', data);
    return res.data;
  },

  async updateBrand(id: string, data: Partial<Brand>): Promise<Brand> {
    const res = await api.patch(`/brands/${id}/`, data);
    return res.data;
  },

  async deleteBrand(id: string) {
    const res = await api.delete(`/brands/${id}/`);
    return res.data;
  },

  async addAsset(brandId: string, data: Partial<OfficialAsset>): Promise<OfficialAsset> {
    const res = await api.post(`/brands/${brandId}/assets/`, data);
    return res.data;
  },

  async toggleVerifyAsset(assetId: string): Promise<OfficialAsset> {
    const res = await api.patch(`/brands/assets/${assetId}/toggle-verify/`);
    return res.data;
  },

  async deleteAsset(assetId: string) {
    const res = await api.delete(`/brands/assets/${assetId}/delete/`);
    return res.data;
  }
};
