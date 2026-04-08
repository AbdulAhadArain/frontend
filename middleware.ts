import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'cloutiq_auth';
const ROLE_COOKIE = 'cloutiq_role';
const MUST_CHANGE_COOKIE = 'cloutiq_must_change';
const REFRESH_TOKEN_COOKIE = 'cloutiq_rt';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/history', '/settings', '/admin'];

// Routes that require ADMIN role
const adminRoutes = ['/admin'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email'
];

// Landing page section routes — rewrite to / so the landing page handles scroll
const sectionRoutes: Record<string, string> = {
  '/pricing': 'pricing',
  '/features': 'features',
  '/how-it-works': 'how',
  '/agencies': 'agencies'
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite section routes to landing page (URL stays clean, e.g. /pricing)
  if (sectionRoutes[pathname]) {
    return NextResponse.rewrite(new URL('/', request.url));
  }
  const isAuthenticated = request.cookies.get(AUTH_COOKIE)?.value === '1';
  const hasRefreshToken = !!request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const userRole = request.cookies.get(ROLE_COOKIE)?.value;
  const mustChange = request.cookies.get(MUST_CHANGE_COOKIE)?.value === '1';

  // Consider user authenticated if either the auth flag or refresh token exists
  const hasSession = isAuthenticated || hasRefreshToken;

  // Check if current path matches any protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path is an auth route (login/register/forgot/reset/verify)
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isChangeCredentials = pathname === '/change-credentials';

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Block all protected routes when mustChangeCredentials is true
  // (except /change-credentials itself)
  if (isProtectedRoute && mustChange && !isChangeCredentials) {
    return NextResponse.redirect(
      new URL('/change-credentials', request.url)
    );
  }

  // Role-based route restrictions
  if (isProtectedRoute && hasSession && !mustChange) {
    const isUserRoute = ['/dashboard', '/history'].some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    );

    // ADMIN can only access /admin and /settings
    if (userRole === 'ADMIN' && isUserRoute) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // USER cannot access /admin
    if (isAdminRoute && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users away from auth pages (login/register/forgot/reset/verify)
  if (isAuthRoute && hasSession) {
    if (mustChange) {
      return NextResponse.redirect(
        new URL('/change-credentials', request.url)
      );
    }
    const dest = userRole === 'ADMIN' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // /change-credentials requires auth but not mustChange check
  if (isChangeCredentials && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/change-credentials',
    '/pricing',
    '/features',
    '/how-it-works',
    '/agencies'
  ]
};
