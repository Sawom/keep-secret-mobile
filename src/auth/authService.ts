import { api, clearNativeCookies } from '../api/client';
import type { User } from '../types';
export const authService = {
    async login(email: string, password: string) { return api.post('/auth/login', { email, password }) as unknown as Promise<{ message: string; user: User }> },
    async register(name: string, email: string, password: string, confirmPassword: string) { return api.post('/auth/register', { name, email, password, confirmPassword }) },
    async logout() { try { await api.post('/auth/logout', {}) } finally { await clearNativeCookies() } },
    async profile() { return api.get('/auth/profile') as unknown as Promise<{ message: string; user: User }> },
    async forgotPassword(email: string) { return api.post('/auth/forgot-password', { email }) },
    async resetPassword(token: string, newPassword: string) { return api.post('/auth/reset-password', { token, newPassword }) },
    async googleMobile(idToken: string) { return api.post('/auth/google/mobile', { idToken }) as unknown as Promise<{ message: string; user: User }> },
};
