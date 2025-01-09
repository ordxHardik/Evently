import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  // publicRoutes: [
  //   '/',              // Home
  //   '/events/*',      // Matches /events/<any-id>
  //   '/api/webhook/clerk',
  //   '/api/webhook/stripe',
  //   '/api/uploadthing'
  // ]
  
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
