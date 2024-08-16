import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

// Declare the modules needed for the NextAuth functions.
// Defines the interfaces for the objects inside those modules.

declare module 'next-auth' {
  interface Session {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    realmId?: string;
    expiresAt?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    realmId?: string;
    expiresAt?: number;
  }
}
