import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((request) => {
  if (!request.auth?.user?.id) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/conversaciones/:path*', '/clientes/:path*', '/usuarios/:path*'],
};
