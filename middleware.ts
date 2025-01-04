import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: [
    '/',               // Publicly accessible route
    '/events/:id',     // Publicly accessible route with dynamic parameter
  ],
  ignoredRoutes: [
    '/api/webhook/clerk',   // Completely ignored by Clerk
    '/api/webhook/stripe',  // Completely ignored by Clerk
    '/api/uploadthing',     // Completely ignored by Clerk
  ]
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
