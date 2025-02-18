import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/webhook",
    "/sign-in",
    "/sign-up",
    "/sign-in/(.*)",
    "/sign-up/(.*)",
  ],

  ignoredRoutes: ["/((?!api|trpc))(_next/.*|.*\\..*$)", "/api/public/(.*)"],

  afterAuth(auth, req, evt) {
    // Handle authentication state
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return Response.redirect(signInUrl);
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
