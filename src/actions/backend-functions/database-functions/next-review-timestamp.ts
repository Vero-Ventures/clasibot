'use server';
import { db } from '@/db/index';
import { NextReviewTimestamp } from '@/db/schema';

// Integration: Called by the classification method during weekly review.
export async function setNextReviewTimestamp(): Promise<string> {
  // Get the current date and create a new date object for one week in the future.
  const currentTime = new Date();
  const futureDate = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    // Insert the new timestamp into the database and return the object as a string.
    const newForReviewTimestamp = await db
      .insert(NextReviewTimestamp)
      .values({ date: futureDate })
      .returning();
    return JSON.stringify(newForReviewTimestamp);
  } catch {
    // If an error occurs, return the stringified date instead.
    return JSON.stringify(futureDate);
  }
}

// Integration: Called by frontend for next review display element.
export async function getNextReviewTimestamp(): Promise<string> {
  // Get the current timestamp into the database.
  const newForReviewTimestamp = await db.select().from(NextReviewTimestamp);
  // Convert the timestamp to local time and return it.
  return newForReviewTimestamp[0].date.toLocaleString();
}
