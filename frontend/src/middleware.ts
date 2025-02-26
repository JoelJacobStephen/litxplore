import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up", "/api(.*)"],
  afterAuth(auth, req, _evt) {
    // Added underscore prefix to unused parameter
    if (!auth.userId && !auth.isPublicRoute) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
