'use server';

export default async function createDatabaseCompany(
  userId: string,
  realmId: string
): Promise<string> {
  // Create a new object to be saved as a company in the database.
  const newCompany = {
    realmId: realmId,
    userId: userId,
    name: 'unset',
    industry: '',
    bookkeeperConnected: false,
    firmName: null,
  };

  // Stringify and return the database company object.
  return JSON.stringify(newCompany);
}
