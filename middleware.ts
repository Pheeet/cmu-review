import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('admin_token')?.value;

  // Verify token if present
  let isValid = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      isValid = true;
    } catch {}
  }

  // Redirect to dashboard if already logged in and visiting login page
  if (pathname === '/admin/login' && isValid) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Allow login page without auth
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all other /admin/* routes
  if (pathname.startsWith('/admin')) {
    if (!isValid) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
