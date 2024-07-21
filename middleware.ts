import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { UserRole } from './utils/auth';

export async function middleware(req: NextRequest) {
  console.log('Middleware started for path:', req.nextUrl.pathname);
  
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('Session status:', session ? 'Active' : 'No session');

  const publicPages = ['/auth/login', '/auth/signup', '/', '/instructor', '/programs', '/inquiry'];
  if (publicPages.includes(req.nextUrl.pathname)) {
    console.log('Public page accessed:', req.nextUrl.pathname);
    return res;
  }

  if (!session) {
    console.log('No session, redirecting to login');
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const userRole = (roleData?.role as UserRole) || 'ordinary';
  console.log('User role:', userRole);

  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log('Admin route accessed');
    if (userRole !== 'superadmin' && userRole !== 'staff') {
      console.log('Unauthorized access to admin route, redirecting');
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  } else if (req.nextUrl.pathname.startsWith('/instructor')) {
    console.log('Instructor route accessed');
    if (userRole === 'instructor' || userRole === 'superadmin' || userRole === 'staff') {
      console.log('Authorized access to instructor route');
      // Remove the profileId check for /instructor/dashboard
      if (req.nextUrl.pathname !== '/instructor/dashboard') {
        const profileId = req.nextUrl.pathname.split('/').pop();
        if (profileId && profileId !== session.user.id && userRole === 'instructor') {
          console.log('Instructor trying to access another profile, redirecting');
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }
      }
    } else {
      console.log('Unauthorized access to instructor route, redirecting');
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  if (req.nextUrl.pathname === '/auth/login' && session) {
    console.log('Logged in user accessing login page, redirecting');
    if (userRole === 'instructor') {
      return NextResponse.redirect(new URL('/instructor/dashboard', req.url));
    } else if (userRole === 'superadmin' || userRole === 'staff') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  console.log('Middleware completed, proceeding with request');
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};