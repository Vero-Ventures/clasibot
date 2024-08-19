import { getAccounts } from '../quickbooks/get-accounts';
import { db } from '@/db/index';
import {
  Transaction as DrizzleTransaction,
  TransactionsToClassifications,
  Classification,
} from '@/db/schema';
import type { Account } from '@/types/Account';
import type { Transaction } from '@/types/Transaction';
import { eq } from 'drizzle-orm';

export async function addTransactions(
  transactions: Transaction[]
): Promise<void> {
  for (const transaction of transactions) {
    try {
      // Make a variable for the transaction ID, used to update the transaction to classification relationship table.
      // Related transaction either already exists or will be created in the following steps.
      let transactionID = 0;

      // Check for an existing transaction with the same name as the current transaction.
      const existingTransaction = await db
        .select()
        .from(DrizzleTransaction)
        .where(eq(DrizzleTransaction.transactionName, transaction.name));

      // Check if there is an existing transaction.
      if (!existingTransaction[0]) {
        // Create a new transaction with the transaction name.
        const newTransaction = await db
          .insert(DrizzleTransaction)
          .values({
            transactionName: transaction.name,
          })
          .returning();

        // Set the transaction ID to the ID of the new transaction.
        transactionID = newTransaction[0].id;
      } else {
        // If an existing transaction is found, set the transaction ID to the ID of the existing transaction.
        transactionID = existingTransaction[0].id;
      }

      // Create an array to store all classifications in the database.
      const classifications = await db.select().from(Classification);

      // Get the list of user accounts and parse them to a list of Account objects.
      const accounts = await getAccounts();
      const parsedAccounts: Account[] = JSON.parse(accounts);

      // Create a dictionary that connects account names to their detail type (base QBO expense category).
      // Takes user inputted names for all of the expense accounts and stores the related base category name.
      const accountNamesToCategories: { [key: string]: string } = {};
      for (const account of parsedAccounts) {
        accountNamesToCategories[account.name] = account.account_sub_type;
      }

      // The transaction account value uses a sub-account hierarchy (Eg. Job Expenses:Job Materials:Plants and Soil).
      // To check against the dictionary, split by ':' and grab the last value to isolate the deepest child account name.
      // (Eg. Job Expenses:Job Materials:Plants and Soil) -> (Plants and Soil).
      const splitAccounts = transaction.category.split(':');
      const deepestTransactionAccount = splitAccounts[splitAccounts.length - 1];

      // Get the base account name for the current transaction using the names to accounts dictionary.
      // Prevents storage of user created data in account names while mainting relevant categorization
      const baseTransactionCategory =
        accountNamesToCategories[deepestTransactionAccount];

      // Check through array of classifications to see if the transactions category already exists.
      const existingCategory = classifications.find(
        (classification) => classification.category === baseTransactionCategory
      );

      // Create or update the classification for the transaction.
      if (existingCategory) {
        // Get the transaction to classificaion relations for the transaction.
        const transactionClassifications = await db
          .select()
          .from(TransactionsToClassifications)
          .where(
            eq(
              TransactionsToClassifications.transactionId,
              existingTransaction[0].id
            )
          );

        // Check the relationship table to see if the transaction is already linked to the classification.
        const existingRelationship = transactionClassifications.find(
          (relationship) =>
            relationship.classificationId === existingCategory.id
        );

        if (!existingRelationship) {
          // If there is no relationship, Create a new one between the transaction and classification.
          await db.insert(TransactionsToClassifications).values({
            transactionId: transactionID,
            classificationId: existingCategory.id,
          });
        }

        // Update the count for the number of times the classification has been used.
        await db
          .update(Classification)
          .set({
            count: existingCategory.count + 1,
          })
          .where(eq(Classification.id, existingCategory.id));
      } else {
        // If the category doesn't exist, create a new classification with a count of 1.
        const newClassification = await db
          .insert(Classification)
          .values({
            category: baseTransactionCategory,
            count: 1,
          })
          .returning();

        // Create a relationship between the transaction and new classification.
        await db.insert(TransactionsToClassifications).values({
          transactionId: transactionID,
          classificationId: newClassification[0].id,
        });
      }
    } catch (error) {
      // Catch and log any errors that occur during the transaction addition process.
      console.error('Error adding transaction:', error);
    }
  }
}
