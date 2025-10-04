import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PUBLIC_PATHS } from './lib/Constants'
import { fetchUserProfile } from './lib/helpers/Helper'
import { ROUTE_PATH } from './lib/Enums'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getUser()
  const user = await fetchUserProfile(data.user)

  // Redirect unauthenticated users to login page except for public ones
  if (!PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL(ROUTE_PATH.SIGNIN, request.url));
    }

    // Redirect to complete profile when needed
    if (!user?.subscriptionInfo?.profile_complete && request.nextUrl.pathname !== ROUTE_PATH.COMPLETE_PROFILE) {
      return NextResponse.redirect(new URL(ROUTE_PATH.COMPLETE_PROFILE, request.url))
    }
    // Redirect to complete profile when needed
    if (user?.subscriptionInfo?.profile_complete && request.nextUrl.pathname === ROUTE_PATH.COMPLETE_PROFILE) {
      return NextResponse.redirect(new URL(ROUTE_PATH.DASHBOARD, request.url))
    }
  
    // Redirect to payment page when needed
    if (user && false/*!user.hasPaymentDue*/) {
      return NextResponse.redirect(new URL('/payment', request.url))
    }
  } else {
    // Redirec authenticated users to dashboard from landing page
    if (user) {
      return NextResponse.redirect(new URL(ROUTE_PATH.DASHBOARD, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images (public images)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
