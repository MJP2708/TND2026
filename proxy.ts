import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'tf_session'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public: login page — bounce to dashboard if already logged in
  if (pathname.startsWith('/login')) {
    if (request.cookies.get(SESSION_COOKIE)?.value) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Protected: all other pages need a valid session cookie
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\.ico|.*\.svg$|.*\.png$).*)',
  ],
}
