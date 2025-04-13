import { tokenService } from './tokenService.ts';

export const auth = {
  async login(email: string, password: string) {
    const res = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    tokenService.set(data.accessToken); // store access token
  },

  async refresh() {
    const res = await fetch('/api/refresh-token', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();
    tokenService.set(data.accessToken);
    return data.accessToken;
  },

  async logout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    tokenService.clear();
  }
};
