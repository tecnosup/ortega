import { NextRequest, NextResponse } from "next/server";
import { verificarSessionToken, CLIENTE_COOKIE } from "@/lib/cliente-auth";

export const runtime = "nodejs";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas dentro de /cliente que não exigem login
  if (pathname === "/cliente/login" || pathname.startsWith("/cliente/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/cliente")) {
    const token = req.cookies.get(CLIENTE_COOKIE)?.value;
    const session = token ? verificarSessionToken(token) : null;

    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/cliente/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cliente/:path*"],
};
