/**
 * Sets up the Prisma client for the application.
 */
import { PrismaClient } from '@prisma/client';

// NOTE: This is a workaround for Prisma's lack of support for global PrismaClient instances.
// Not an issue as transfer to Drizzle is planned.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient;
}

let prisma: PrismaClient;

if (process.env.APP_CONFIG === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
