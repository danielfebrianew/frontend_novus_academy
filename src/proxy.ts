import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const hasSession = request.cookies.has('novus_rt');

  if (isPublicRoute && hasSession) {
    return NextResponse.redirect(new URL('/generate-video', request.url));
  }

  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login?expired=true', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};