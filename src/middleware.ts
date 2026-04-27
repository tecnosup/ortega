import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = req.cookies.get("base_admin_session")?.value;

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    try {
      const res = await fetch(`${req.nextUrl.origin}/api/admin/session`, {
        method: "GET",
        headers: { Cookie: `base_admin_session=${session}` },
      });
      if (!res.ok) throw new Error("invalid");
    } catch {
      const response = NextResponse.redirect(new URL("/admin/login", req.url));
      response.cookies.delete("base_admin_session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
