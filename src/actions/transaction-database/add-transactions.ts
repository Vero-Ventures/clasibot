import prisma from '@/lib/db';
import { getAccounts } from '../quickbooks';
import type { Account } from '@/types/Account';
import type { Transaction } from '@/types/Transaction';

export async function addTransactions(
  transactions: Transaction[]
): Promise<void> {
  for (const transaction of transactions) {
    try {
      // Check if a TransactionClassification with the same name already exists in the database.
      const existingTransaction =
        await prisma.transactionClassification.findUnique({
          where: { transactionName: transaction.name },
          include: { classifications: true },
        });

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

      if (existingTransaction) {
        // Find if the transaction has already been categorized and saved in the classifications array.
        const existingCategory = existingTransaction.classifications.find(
          (classification: { category: string }) =>
            classification.category === baseTransactionCategory
        );

        // If the category already exists, increment its count by 1
        if (existingCategory) {
          await prisma.classification.update({
            where: { id: existingCategory.id },
            data: { count: { increment: 1 } },
          });
        } else {
          // If the category doesn't exist, create a new classification with a count of 1.
          await prisma.classification.create({
            data: {
              category: baseTransactionCategory,
              count: 1,
              transactionClassificationId: existingTransaction.id,
            },
          });
        }
      } else {
        // If the TransactionClassification doesn't exist, create a new one with a count of 1.
        await prisma.transactionClassification.create({
          data: {
            transactionName: transaction.name,
            classifications: {
              create: {
                category: baseTransactionCategory,
                count: 1,
              },
            },
          },
        });
      }
    } catch (error) {
      // Catch and log any errors that occur during the transaction addition process.
      console.error('Error adding transaction:', error);
    }
  }
}
