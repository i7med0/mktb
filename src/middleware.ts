import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    const role = token.role as string;
    
    // IP Whitelisting for OFFICE
    if (role === "OFFICE") {
      const allowedIps = token.allowedIps as string[] | string | null;
      if (allowedIps) {
        // Simple check (in production, use real IP from headers)
        const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
        
        let ipList: string[] = [];
        if (Array.isArray(allowedIps)) {
          ipList = allowedIps;
        } else if (typeof allowedIps === "string") {
          ipList = allowedIps.split(",").map(ip => ip.trim());
        }
        
        // If IP is not in whitelist, block access (redirect to unauthorized)
        if (!ipList.includes(clientIp) && ipList.length > 0 && ipList[0] !== "*") {
          if (path !== "/unauthorized") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
          }
        }
      }
    }

    // Role-based Routing Restrictions
    if (path.startsWith("/super-admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(`/${role.toLowerCase().replace("_", "-")}`, req.url));
    }

    if (path.startsWith("/office") && role !== "OFFICE") {
      return NextResponse.redirect(new URL(`/${role.toLowerCase().replace("_", "-")}`, req.url));
    }

    if (path.startsWith("/employee") && role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL(`/${role.toLowerCase().replace("_", "-")}`, req.url));
    }

    // Redirect root to appropriate dashboard
    if (path === "/") {
      return NextResponse.redirect(new URL(`/${role.toLowerCase().replace("_", "-")}`, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    }
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|unauthorized).*)"],
};
