import { NextRequest, NextResponse } from "next/server";

// DEMO MODE: autenticação desativada para apresentação ao cliente
export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
