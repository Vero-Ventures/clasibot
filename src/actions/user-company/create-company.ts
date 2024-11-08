// Takes: A database User object Id as well as the related Company realm Id.
// Returns: A stringified object that can be used to create a database Company object.
export async function createDatabaseCompany(
  userId: string,
  realmId: string
): Promise<string> {
  // Create a new Company object to be saved in the database.
  const newCompany = {
    realmId: realmId,
    userId: userId,
    name: 'unset',
    industry: '',
    bookkeeperConnected: false,
    firmName: null,
  };

  // Stringify and return the database Company object.
  return JSON.stringify(newCompany);
}
