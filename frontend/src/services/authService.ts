import api from './api';
import { User, Organization } from '../types';

export const authService = {
  async register(data: any) {
    const res = await api.post('/auth/register/', data);
    return res.data;
  },

  async verifyOtp(destination: string, otp: string, purpose: string = 'REGISTRATION') {
    const res = await api.post('/auth/verify-otp/', { destination, otp, purpose });
    if (res.data.tokens) {
      localStorage.setItem('brandshield_access_token', res.data.tokens.access);
      localStorage.setItem('brandshield_refresh_token', res.data.tokens.refresh);
      localStorage.setItem('brandshield_user', JSON.stringify(res.data.user));
      localStorage.setItem('brandshield_org', JSON.stringify(res.data.organization));
    }
    return res.data;
  },

  async resendOtp(destination: string, purpose: string = 'REGISTRATION', channel: string = 'EMAIL') {
    const res = await api.post('/auth/resend-otp/', { destination, purpose, channel });
    return res.data;
  },

  async login(emailOrMobile: string, password: string, rememberMe: boolean = false) {
    const res = await api.post('/auth/login/', { email_or_mobile: emailOrMobile, password, remember_me: rememberMe });
    if (res.data.tokens) {
      localStorage.setItem('brandshield_access_token', res.data.tokens.access);
      localStorage.setItem('brandshield_refresh_token', res.data.tokens.refresh);
      localStorage.setItem('brandshield_user', JSON.stringify(res.data.user));
      localStorage.setItem('brandshield_org', JSON.stringify(res.data.organization));
    }
    return res.data;
  },

  async forgotPassword(destination: string, channel: string = 'EMAIL') {
    const res = await api.post('/auth/forgot-password/', { destination, channel });
    return res.data;
  },

  async resetPassword(data: any) {
    const res = await api.post('/auth/reset-password/', data);
    return res.data;
  },

  async faceEnroll(imageBase64: string, consent: boolean = true) {
    const res = await api.post('/auth/face/enroll/', { image_base64: imageBase64, consent });
    return res.data;
  },

  async faceVerify(imageBase64: string, email?: string) {
    const res = await api.post('/auth/face/verify/', { image_base64: imageBase64, email });
    if (res.data.tokens) {
      localStorage.setItem('brandshield_access_token', res.data.tokens.access);
      localStorage.setItem('brandshield_refresh_token', res.data.tokens.refresh);
      localStorage.setItem('brandshield_user', JSON.stringify(res.data.user));
      localStorage.setItem('brandshield_org', JSON.stringify(res.data.organization));
    }
    return res.data;
  },

  async deleteFaceEnrollment() {
    const res = await api.delete('/auth/face/enrollment/');
    return res.data;
  },

  async getMe(): Promise<{ user: User; organization: Organization }> {
    const res = await api.get('/auth/me/');
    return res.data;
  },

  logout() {
    localStorage.removeItem('brandshield_access_token');
    localStorage.removeItem('brandshield_refresh_token');
    localStorage.removeItem('brandshield_user');
    localStorage.removeItem('brandshield_org');
    window.location.href = '/login';
  }
};
