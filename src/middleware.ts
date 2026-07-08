import { NextRequest, NextResponse } from "next/server";
import { verificarSessionToken, CLIENTE_COOKIE } from "@/lib/cliente-auth";
import { ASSINATURAS_ATIVAS } from "@/lib/flags";

export const runtime = "nodejs";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Assinaturas/área do cliente ocultas: qualquer acesso a /cliente ou /assinatura
  // é redirecionado pra home (nem por link direto/favorito entra).
  if (!ASSINATURAS_ATIVAS && (pathname.startsWith("/cliente") || pathname.startsWith("/assinatura"))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

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
  matcher: ["/cliente/:path*", "/assinatura/:path*"],
};
