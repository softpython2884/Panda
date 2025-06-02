
import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, type DecodedToken } from '@/lib/auth-edge';

const AUTH_COOKIE_NAME = 'panda_session_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/dashboard', '/manager'];
  const authPaths = ['/auth/login', '/auth/register'];

  const isProtectedPath = protectedPaths.some(p => pathname.startsWith(p));
  const isAuthPath = authPaths.some(p => pathname.startsWith(p));

  const tokenCookie = request.cookies.get(AUTH_COOKIE_NAME);
  let userId = null;

  if (tokenCookie?.value) {
    // verifyToken from auth-edge is now async
    const decoded = await verifyToken<DecodedToken>(tokenCookie.value); 
    if (decoded) {
      userId = decoded.id;
    }
  }

  if (isProtectedPath && !userId) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && userId) {
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
     * - /api/pod/ (PANDA Pod public APIs like search. Auth for pod routes is handled within the route)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/pod/).*)',
  ],
};
