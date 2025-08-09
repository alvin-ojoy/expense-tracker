import { NextResponse } from "next/server"
import { updateSession } from "./lib/supabase/middleware.js"

export async function middleware(request) {
  const { supabaseResponse, user } = await updateSession(request)

  // Optimize route matching with Set for O(1) lookups
  const protectedPrefixes = new Set(['/dashboard', '/expenses', '/summary', '/budget', '/settings'])
  const authPrefixes = new Set(['/login', '/signup', '/reset-password'])
  
  const pathname = request.nextUrl.pathname
  
  // Early return for static assets
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return supabaseResponse
  }
  
  // Check route types efficiently
  const isProtectedRoute = Array.from(protectedPrefixes).some(prefix => 
    pathname === prefix || pathname.startsWith(prefix + '/')
  )
  const isAuthRoute = Array.from(authPrefixes).some(prefix => 
    pathname === prefix || pathname.startsWith(prefix + '/')
  )

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Protect dashboard routes
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}