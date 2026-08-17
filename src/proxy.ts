import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((request) => {
  if (!request.auth) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/conversaciones/:path*', '/clientes/:path*'],
};
