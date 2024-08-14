import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

// Declare the modules needed for the NextAuth functions.

declare module 'next-auth' {
  // Define session object interface for next auth functions.
  interface Session {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    realmId?: string;
    expiresAt?: number;
  }
}

declare module 'next-auth/jwt' {
  // Define JWT object interface for next auth functions.
  interface JWT {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    realmId?: string;
    expiresAt?: number;
  }
}
