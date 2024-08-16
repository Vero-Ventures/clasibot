import NextAuth from 'next-auth';
import { cookies } from 'next/headers';
import { options } from './options';

// Define the NextAuth handler using the options file.
const handler = NextAuth(options);

const GET = async (req: Request, res: Response) => {
  // Define the url from the request.
  const url = new URL(req.url || '');
  // check if request is from /api/auth/callback/quickbooks
  if (url.pathname === '/api/auth/callback/quickbooks') {
    // Get the realmId from the url.
    const realmId = url.searchParams.get('realmId');
    // If realmId is available, set it in the cookies as secure.
    if (realmId) {
      cookies().set('realmId', realmId, { secure: true });
    }
  }
  // Pass the request.
  return handler(req, res);
};

// Export the GET function and the handler as POST.
export { GET, handler as POST };
