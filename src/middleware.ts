import { createAuthMiddleware } from "@toka-auth/kit";
import { getTokaConfig } from "@/lib/auth/toka";

/**
 * Authentication is delegated to the central Toka auth app; this app has no
 * sign-in page of its own. An unauthenticated request is redirected to
 * NEXT_PUBLIC_CLERK_SIGN_IN_URL by `clerkAuth.protect()`.
 *
 * easyjobs accepts any signed-in Toka user, so there is no `requireAppAccess`
 * gate — the middleware's default protect() is the whole policy.
 *
 * `/api/graphql` is left public here because it authenticates itself: it serves
 * both session-backed requests and webhook calls bearing CV_WEBHOOK_SECRET, and
 * resolves the caller in `src/graphql/context.ts`.
 */
export default createAuthMiddleware(getTokaConfig(), {
  publicRoutes: ["/api/graphql(.*)"],
});

export const config = {
  matcher: [
    // Everything except Next internals and static assets...
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // ...plus API routes, which the pattern above deliberately skips.
    "/(api|trpc)(.*)",
  ],
};
