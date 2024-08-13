import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  // Define session object interface for next auth.
  // Contains user and realm ID, access and refresh tokens, and expiration time.
  interface Session {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    realmId?: string;
    expiresAt?: number;
  }
}

declare module 'next-auth/jwt' {
  // Define JWT object interface for next auth.
  // Contains user and realm ID, access and refresh tokens, and expiration time.
  interface JWT {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    realmId?: string;
    expiresAt?: number;
  }
}
