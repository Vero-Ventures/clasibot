'use server';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { getCompanyName, getCompanyIndustry } from '../quickbooks/user-info';

export async function checkCompanyConnection(): Promise<boolean> {
  // Get the company identifing info from the session.
  const session = await getServerSession(options);
  const realmId = session?.realmId;
  // Check the identifing info could be found.
  if (realmId) {
    // Check that the company with that realmId exists in the database.
    const currentCompany = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, realmId));
    // If a company was found, update its values then return its connection status.
    if (currentCompany.length > 0) {
      await updateCompanyInfo(realmId);
      return currentCompany[0].bookkeeperConnected;
    } else {
      // If no company is found, the connection is false.
      return false;
    }
  } else {
    // If realm ID could not be found, return false.
    return false;
  }
}

async function updateCompanyInfo(realmId: string) {
  // Get the current company from the database.
  const currentCompany = await db
    .select()
    .from(Company)
    .where(eq(Company.realmId, realmId));
  // If a company was found, update its values then return its connection status.
  if (currentCompany.length > 0) {
    // Define the first company as the company as unique check ensure only ever 0 or 1 values are returned.
    const updateCompany = currentCompany[0];

    // Get the company name and update the company object.
    const companyName = await getCompanyName();
    if (companyName !== 'Error: Name not found') {
      updateCompany.name = companyName;
    }

    // Get the company name and update the company object.
    const companyIndustry = await getCompanyIndustry();
    if (
      companyIndustry !== 'Error' &&
      companyIndustry !== 'None' &&
      companyIndustry !== ''
    ) {
      updateCompany.industry = companyIndustry;
    }

    // Update the database with the updated company object.
    await db
      .update(Company)
      .set(updateCompany)
      .where(eq(Company.realmId, realmId));
  }
}
