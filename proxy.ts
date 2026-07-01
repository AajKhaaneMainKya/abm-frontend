import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ============================================================
// Clerk auth — Next 16 `proxy` convention.
//
// In Next 16 the `middleware` file convention was renamed to `proxy`
// (see node_modules/next/dist/docs/.../file-conventions/proxy.md). Clerk's
// clerkMiddleware() handler is filename-agnostic, so it lives here in proxy.ts.
//
// Public routes: the splash + Clerk's own sign-in/up. Everything else requires
// a signed-in user; unauthenticated requests are redirected to the /welcome
// splash (not Clerk's hosted page) so the XP experience stays intact.
// ============================================================

const isPublicRoute = createRouteMatcher([
  "/welcome",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }
});

export const config = {
  // Run on everything except Next internals and static files, plus API routes.
  matcher: ["/((?!_next|.*\\..*).*)", "/", "/(api|trpc)(.*)"],
};
