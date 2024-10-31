import { NextResponse } from 'next/server';
import { db } from '@/db';
import { QuickbooksToken } from '@/db/schema';
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

    await db
      .insert(QuickbooksToken)
      .values({
        companyId,
        tokenValue,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [QuickbooksToken.companyId],
        set: {
          tokenValue,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
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
