import Cookies from 'js-cookie';
import { TOKEN_KEY } from './api';

export function getServerToken(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${TOKEN_KEY}=([^;]+)`));
  return match ? match[1] : null;
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!Cookies.get(TOKEN_KEY) || !!localStorage.getItem(TOKEN_KEY);
}
