
import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth-edge'; // auth-edge for middleware

const AUTH_COOKIE_NAME = 'panda_session_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/dashboard', '/manager', '/settings']; // Added /settings
  const adminPaths = ['/admin'];
  const authPaths = ['/auth/login', '/auth/register'];

  const isProtectedPath = protectedPaths.some(p => pathname.startsWith(p));
  const isAdminPath = adminPaths.some(p => pathname.startsWith(p));
  const isAuthPath = authPaths.some(p => pathname.startsWith(p));

  const tokenCookie = request.cookies.get(AUTH_COOKIE_NAME);
  let userSession: AuthenticatedUser | null = null;

  if (tokenCookie?.value) {
    userSession = await verifyToken<AuthenticatedUser>(tokenCookie.value); 
  }

  // Handle Admin Paths
  if (isAdminPath) {
    if (!userSession) {
      return NextResponse.redirect(new URL('/auth/login?redirect=' + pathname, request.url));
    }
    if (userSession.role !== 'ADMIN') {
      // Optional: Redirect to a 'forbidden' page or dashboard
      return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url)); 
    }
    return NextResponse.next();
  }

  // Handle Protected Paths (non-admin)
  if (isProtectedPath && !userSession) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle Auth Paths
  if (isAuthPath && userSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /api/pod/ (PANDA Pod public APIs. Auth for pod routes is handled within the route)
     * - /connect/ (Public redirect route)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/pod/|connect/).*)',
  ],
};
