import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();

  // Mock auth handling - only in development
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_MOCK_AUTH === "true"
  ) {
    console.log("Using mock authentication");
    if (
      req.nextUrl.pathname === "/login" ||
      req.nextUrl.pathname === "/register"
    ) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Regular auth handling
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Verify both session and user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (sessionError || userError || !session || !user) {
      console.log("No valid session found", { sessionError, userError });

      // Redirect to login if trying to access protected routes
      if (
        req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/onboarding")
      ) {
        url.pathname = "/login";
        url.searchParams.set("redirect", req.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
      return res;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("onboarding_completed, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const needsOnboarding =
      !profile?.onboarding_completed ||
      !profile?.first_name ||
      !profile?.last_name;

    // Handle onboarding redirection
    if (needsOnboarding && !req.nextUrl.pathname.startsWith("/onboarding")) {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (!needsOnboarding && req.nextUrl.pathname.startsWith("/onboarding")) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Redirect away from auth pages if authenticated
    if (
      (req.nextUrl.pathname === "/login" ||
        req.nextUrl.pathname === "/register") &&
      !needsOnboarding
    ) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/onboarding"],
};
