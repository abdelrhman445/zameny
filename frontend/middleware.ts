import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_KEY } from './lib/api';

const PROTECTED_PATHS = ['/overview', '/orders', '/products', '/customers', '/settings'];
const AUTH_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;

  const isDashboardRoute = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PATHS.some((p) => pathname === p);

  // Redirect unauthenticated users to login
  if (isDashboardRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/overview/:path*',
    '/orders/:path*',
    '/products/:path*',
    '/customers/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
