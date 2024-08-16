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
      // Check for an existing transaction with the same name.
      const existingTransaction = await db
        .select()
        .from(DrizzleTransaction)
        .where(eq(DrizzleTransaction.transactionName, transaction.name));

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

      // Create an array to store the classifications for the transaction.
      const classifications: {
        id: number;
        category: string;
        count: number;
      }[] = [];

      // Get the classification for each relationship and add it to the classifications array.
      for (const relationship of transactionClassifications) {
        const classification = await db
          .select()
          .from(Classification)
          .where(eq(Classification.id, relationship.classificationId));
        classifications.push(classification[0]);
      }

      // Get the list of user accounts and parse them to a list of Account objects.
      const accounts = await getAccounts();
      const parsedAccounts: Account[] = JSON.parse(accounts);

      // Create a dictionary that connects account names to their detail type (base QBO expense category).
      // Takes user inputted names for all of the expense accounts and stores the related base category name.
      const accountNamesToCategories: { [key: string]: string } = {};
      for (const account of parsedAccounts) {
        accountNamesToCategories[account.name] = account.account_sub_type;
      }

      // The transaction account value shows sub-account hierarchy (Eg. Job Expenses:Job Materials:Plants and Soil).
      // To check against the dictionary, split by ':' and grab the last value to isolate the deepest child account name.
      // (Eg. Job Expenses:Job Materials:Plants and Soil) -> (Plants and Soil).
      const splitAccounts = transaction.category.split(':');
      const deepestTransactionAccount = splitAccounts[splitAccounts.length - 1];

      // Get the base account name for the current transaction using the names to accounts dictionary.
      // Prevents storage of user created data in account names while mainting relevant categorization
      const baseTransactionCategory =
        accountNamesToCategories[deepestTransactionAccount];

      // Check through array of classifications to see if the transaction has already been categorized.
      const existingCategory = classifications.find(
        (classification) => classification.category === baseTransactionCategory
      );

      // Create variables to store the IDs needed to update the relationship table.
      let relatedTransactionId: number;
      let relatedClassificationId: number;

      // Create or update the classification for the transaction.
      if (existingCategory) {
        // If the category already exists, increment its count by 1
        await db
          .update(Classification)
          .set({
            count: existingCategory.count + 1,
          })
          .where(eq(Classification.id, existingCategory.id));

        // Record the id of the updated classification.
        relatedClassificationId = existingCategory.id;
      } else {
        // If the category doesn't exist, create a new classification with a count of 1.
        const newClassification = await db
          .insert(Classification)
          .values({
            category: baseTransactionCategory,
            count: 1,
          })
          .returning();

        // Record the id of the new classification.
        relatedClassificationId = newClassification[0].id;
      }

      // Create a new transaction if needed and record its id, or get the id of the existing transaction.
      if (!existingTransaction[0]) {
        // Create a new transaction with the transaction name.
        const newTransaction = await db
          .insert(DrizzleTransaction)
          .values({
            transactionName: transaction.name,
          })
          .returning();

        // Record the id of the new transaction.
        relatedTransactionId = newTransaction[0].id;
      } else {
        // Record the id of the existing transaction.
        relatedTransactionId = existingTransaction[0].id;
      }

      // Create a new relationship between the transaction and classification.
      await db.insert(TransactionsToClassifications).values({
        transactionId: relatedTransactionId,
        classificationId: relatedClassificationId,
      });
    } catch (error) {
      // Catch and log any errors that occur during the transaction addition process.
      console.error('Error adding transaction:', error);
    }
  }
}
