'use server'
import { db } from '@/db/index';
import { User } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function updateIndustry(industry: string, email:string) {
  try {
    // Update the user's industry using the email.
    await db
      .update(User)
      .set({
        industry: industry,
      })
      .where(eq(User.email, email));

    // If the industry is updated successfully, return a success message.
    return 'Industry Updated Successfully'
  } catch (error) {
    // Log error to console and return an error response string.
    console.error(error)
    return 'Error';
  }
}
