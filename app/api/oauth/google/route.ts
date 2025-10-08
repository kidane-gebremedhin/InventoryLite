import { ROUTE_PATH } from "@/lib/Enums";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    // PKCE, Prove Key for Code Exchange pattern
    if (code) {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // Handle cookie setting error
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:')
        return NextResponse.redirect(new URL(ROUTE_PATH.SIGNIN, process.env.APP_URL))
      }

      console.log('Auth callback - Session exchanged successfully:')
      
      // Redirect to the intended page or dashboard
      return NextResponse.redirect(new URL(ROUTE_PATH.DASHBOARD, process.env.APP_URL))
    } catch (error) {
      console.error('Error in auth callback:')
      return NextResponse.redirect(new URL(ROUTE_PATH.SIGNIN, process.env.APP_URL))
    }
  }

  // Return to signin if no code is present
  return NextResponse.redirect(new URL(ROUTE_PATH.SIGNIN, process.env.APP_URL))
}