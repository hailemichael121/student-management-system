import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the user is authenticated
  if (!session) {
    // If the user is not authenticated and trying to access a protected route
    if (
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/onboarding")
    ) {
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }

  // If the user is authenticated
  if (session) {
    // Check if the user has completed onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, first_name, last_name")
      .eq("id", session.user.id)
      .single();

    const needsOnboarding =
      !profile?.onboarding_completed ||
      !profile?.first_name ||
      !profile?.last_name;

    // If the user needs onboarding and is not on the onboarding page
    if (needsOnboarding && req.nextUrl.pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // If the user has completed onboarding and is trying to access the onboarding page
    if (!needsOnboarding && req.nextUrl.pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If the user is authenticated and trying to access login or register pages
    if (
      req.nextUrl.pathname === "/login" ||
      req.nextUrl.pathname === "/register"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/onboarding"],
};
