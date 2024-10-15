'use server';
import { db } from '@/db/index';
import { NextReviewTimestamp } from '@/db/schema';

export async function setNextReviewTimestamp(): Promise<string> {
  // Get the current date
  const currentTime = new Date();

  // Create a new date for one week in the future (7 days)
  const futureDate = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    // Insert the new timestamp into the database.
    const newForReviewTimestamp = await db
      .insert(NextReviewTimestamp)
      .values({ date: futureDate })
      .returning();
    return JSON.stringify(newForReviewTimestamp);
  } catch {
    // If an error occurs, return just the stringified date instead.
    return JSON.stringify(futureDate);
  }
}

export async function getNextReviewTimestamp(): Promise<string> {
  // Insert the new timestamp into the database.
  const newForReviewTimestamp = await db.select().from(NextReviewTimestamp);

  return newForReviewTimestamp[0].date.toLocaleString();
}
