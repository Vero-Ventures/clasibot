'use server';

// Takes a database user object Id as well as the realm Id of the related company.
// Returns: A stringified object that can be used to create a database company object.
export default async function createDatabaseCompany(
  userId: string,
  realmId: string
): Promise<string> {
  // Create a new company object to be saved in the database.
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
