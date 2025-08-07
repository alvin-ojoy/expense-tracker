import { NextResponse } from "next/server"
import { updateSession } from "./lib/supabase/middleware.js"

export async function middleware(request) {
  const { supabaseResponse, user } = await updateSession(request)

  // Protected routes
  const protectedRoutes = ["/dashboard", "/expenses", "/summary"]
  const authRoutes = ["/login", "/signup"]
  
  const pathname = request.nextUrl.pathname
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
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