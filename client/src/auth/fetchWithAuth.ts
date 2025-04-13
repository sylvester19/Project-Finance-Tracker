import { tokenService } from './tokenService';
import { auth } from './auth';

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = tokenService.get();

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(input, {
    ...init,
    headers,
    credentials: 'include', // important for sending refresh cookie
  });

  // If token expired and we haven’t retried yet
  if (res.status === 401 && retry) {
    try {
      const newToken = await auth.refresh();

      headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(input, {
        ...init,
        headers,
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Refresh token failed');
      tokenService.clear();
      throw err;
    }
  }

  return res;
}
