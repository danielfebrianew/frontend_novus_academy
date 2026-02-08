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
    
    if (window.electronAPI) {
      await window.electronAPI.saveRefreshToken(data.refreshToken);
    } else {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    
    this.scheduleTokenRefresh(data.expiresIn);
    
    return data.user;
  }

  async refresh() {
    let refreshToken: string | undefined;
    
    if (window.electronAPI) {
      refreshToken = await window.electronAPI.getRefreshToken();
    } else {
      refreshToken = localStorage.getItem('refreshToken') || undefined;
    }
    
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
    let refreshToken: string | undefined;
    
    if (window.electronAPI) {
      refreshToken = await window.electronAPI.getRefreshToken();
    } else {
      refreshToken = localStorage.getItem('refreshToken') || undefined;
    }
    
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
    
    if (window.electronAPI) {
      await window.electronAPI.removeRefreshToken();
    } else {
      localStorage.removeItem('refreshToken');
    }
    
    if (this.refreshTokenTimer) clearTimeout(this.refreshTokenTimer);
  }
}

export const authService = new AuthService();