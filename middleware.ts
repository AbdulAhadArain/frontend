import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'cloutiq_auth';
const ROLE_COOKIE = 'cloutiq_role';
const MUST_CHANGE_COOKIE = 'cloutiq_must_change';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/history', '/settings', '/admin'];

// Routes that require ADMIN role
const adminRoutes = ['/admin'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.get(AUTH_COOKIE)?.value === '1';
  const userRole = request.cookies.get(ROLE_COOKIE)?.value;
  const mustChange = request.cookies.get(MUST_CHANGE_COOKIE)?.value === '1';

  // Check if current path matches any protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path is an auth route (login/register)
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isChangeCredentials = pathname === '/change-credentials';

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
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
  if (isProtectedRoute && isAuthenticated && !mustChange) {
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

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    if (mustChange) {
      return NextResponse.redirect(
        new URL('/change-credentials', request.url)
      );
    }
    const dest = userRole === 'ADMIN' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // /change-credentials requires auth but not mustChange check
  if (isChangeCredentials && !isAuthenticated) {
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
    '/change-credentials'
  ]
};
