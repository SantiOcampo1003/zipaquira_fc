import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Supabase a veces redirige a Site URL (/) con ?code= si falta /auth/callback en Redirect URLs. */
export function middleware(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code || request.nextUrl.pathname === "/auth/callback") {
    return NextResponse.next();
  }

  const scroll = request.nextUrl.searchParams.get("scroll");
  const next =
    request.nextUrl.searchParams.get("next") ??
    (scroll ? `/?scroll=${encodeURIComponent(scroll)}` : "/?scroll=partidos");

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/auth/callback";
  redirectUrl.searchParams.set("next", next);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
