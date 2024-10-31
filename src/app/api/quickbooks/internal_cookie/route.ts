import { NextResponse } from 'next/server';
import { db } from '@/db';
import { QuickbooksToken } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  if (authHeader !== `Bearer ${process.env.TASK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { companyId, tokenValue, expiresAt } = await req.json();

    if (!companyId || !tokenValue || !expiresAt) {
      return NextResponse.json(
        { error: 'companyId, token value, and expiry time are required' },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(QuickbooksToken)
        .where(eq(QuickbooksToken.companyId, companyId));

      await tx.insert(QuickbooksToken).values({
        companyId,
        tokenValue,
        expiresAt,
      });
    });

    return NextResponse.json({
      success: true,
      message: `Token stored for companyId: ${companyId}`,
    });
  } catch (error) {
    console.error('Failed to store QBO token:', error);
    return NextResponse.json(
      { error: 'Failed to store QBO token' },
      { status: 500 }
    );
  }
}
