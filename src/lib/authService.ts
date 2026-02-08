// lib/authService.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class AuthService {
  private accessToken: string | null = null;
  private refreshTokenTimer: NodeJS.Timeout | null = null;

  async login(email: string, password: string) {
    const result = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!result.ok) {
      const error = await result.json();
      throw new Error(error.message || 'Login gagal');
    }

    const response = await result.json();
    const data = response.data;
    
    this.accessToken = data.accessToken;
    
    localStorage.setItem('refreshToken', data.refreshToken);
    
    this.scheduleTokenRefresh(data.expiresIn);
    
    return data.user;
  }

  async refresh() {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) throw new Error('No refresh token');

    const result = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!result.ok) {
      await this.logout();
      throw new Error('Session expired');
    }

    const response = await result.json();
    const data = response.data;
    
    this.accessToken = data.accessToken;
    this.scheduleTokenRefresh(data.expiresIn);
    
    return data.user;
  }

  scheduleTokenRefresh(expiresIn: number) {
    if (this.refreshTokenTimer) clearTimeout(this.refreshTokenTimer);
    
    const refreshTime = (expiresIn - 60) * 1000;
    
    this.refreshTokenTimer = setTimeout(async () => {
      try {
        await this.refresh();
      } catch {
        window.location.href = '/login';
      }
    }, refreshTime);
  }

  getAccessToken() {
    return this.accessToken;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    this.accessToken = null;
    
    localStorage.removeItem('refreshToken');
    
    if (this.refreshTokenTimer) clearTimeout(this.refreshTokenTimer);
  }
}

export const authService = new AuthService();