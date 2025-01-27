import { db } from '@/db';
import { TaxCode } from '@/db/schema';

export async function GET() {
  try {
    await db.select().from(TaxCode);

    return new Response('Success', { status: 200 });
  } catch {
    return new Response('Error', { status: 400 });
  }
}
