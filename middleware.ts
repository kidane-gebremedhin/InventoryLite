import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PUBLIC_PATHS } from './lib/Constants'
import { CookiesKey, ROUTE_PATH, UserRole } from './lib/Enums'
import { fetchUserProfile } from './lib/server_actions/user'

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
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null;
  const userSubscriptionInfo = request.cookies.get(CookiesKey.ucookiesinfo)?.value;
  if (!userSubscriptionInfo) {
    const { data } = await supabase.auth.getUser()
    if (data) {
      user = await fetchUserProfile(data.user)
      supabaseResponse.cookies.set({
        name: CookiesKey.ucookiesinfo,
        value: JSON.stringify(user),
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: '/',
      });

      console.log("User details From DB")
    }
  } else {
    // Clear cookies on logout
    if (request.cookies.getAll().length == 1) {
      supabaseResponse.cookies.delete(CookiesKey.ucookiesinfo);
    } else {
      console.log("User details From Cookies")
      user = JSON.parse(userSubscriptionInfo);
    }
  }

  // Redirect unauthenticated users to login page except for public ones
  if (!PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL(ROUTE_PATH.SIGNIN, request.url));
    }

    // Redirect to complete profile when needed
    if (user?.subscriptionInfo?.role !== UserRole.SUPER_ADMIN && !user?.subscriptionInfo?.profile_complete && request.nextUrl.pathname !== ROUTE_PATH.COMPLETE_PROFILE) {
      return NextResponse.redirect(new URL(ROUTE_PATH.COMPLETE_PROFILE, request.url))
    }
    // Redirect to complete profile when needed
    if (user?.subscriptionInfo?.profile_complete && request.nextUrl.pathname === ROUTE_PATH.COMPLETE_PROFILE) {
      return NextResponse.redirect(new URL(ROUTE_PATH.DASHBOARD, request.url))
    }
    // Restrict SUPER_ADMIN pages
    if (user?.subscriptionInfo?.role !== UserRole.SUPER_ADMIN && request.nextUrl.pathname === ROUTE_PATH.ADMIN_FEEDBACK_MANAGEMENT) {
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
