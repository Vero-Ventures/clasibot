// schema.ts

import {
  pgTable,
  primaryKey,
  uuid,
  boolean,
  decimal,
  integer,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Defines the base User that may related to multiple Companies.
/**
 * id: Auto assigned, used for database identification.
 * userName: QuickBooks Online name of the User.
 * email: Email address that the User used to log into the app through QuickBooks Online.
 * subscriptionId: Connects the User to their database Subscription by its database Id.
 */
export const User = pgTable('User', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userName: text('user_name'),
  email: text('email').unique().notNull(),
  subscriptionId: uuid('subscription_id').unique(),
});

export const UserToCompanyRelations = relations(User, ({ many }) => ({
  companies: many(Company),
}));

// Defines a potential element of a User indicating they belong to a Firm.
// Firms have the potential for multiple related Companies.
/**
 * id: Auto assigned, used for database identification.
 * name: Name of the QuickBooks Online Firm.
 * userId: Database Id of the related User.
 * userName: QuickBooks Online name of the realted User.
 */
export const Firm = pgTable('Firm', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  name: text('name').notNull(),
  userId: uuid('user_id').references(() => User.id, { onDelete: 'cascade' }),
  userName: text('user_name').notNull(),
});

// Defines the Stripe Subscription of a User.
/**
 * id: Auto assigned, used for database identification.
 * userId: The FK that connects to the database User by their userId.
 * stripeId: Stripe based Id that allows access to the User's Subscription.
 */
export const Subscription = pgTable('Subscription', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id')
    .unique()
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  stripeId: text('stripe_id').unique(),
});

// A QuickBooks Company that is assosiated with a user.
// Also defines possible relation to a Firm and Synthetic Bookkeeper connection status.
/**
 * id: Auto assigned, used for database identification.
 * realmId: QuickBooks Online Id for the company.
 * userId: The FK that connects to the database User by their userId.
 * name: The name of the QuickBooks Online Company.
 * firmName: Potentially null name of the Firm that provided access to the Company.
 * bookkeeperConnected: Indicates if the Synthetic Bookkeeper is connected to the Company.
 */
export const Company = pgTable('Company', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  realmId: text('realm_id').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  firmName: text('firm_name'),
  bookkeeperConnected: boolean('bookkeeper_connected').notNull(),
});

// Defines a Transaction name to record connected Classifications for Database referencing.
/**
 * id: Auto assigned, used for database identification.
 * transactionName: The name of the Transaction.
 */
export const Transaction = pgTable('Transaction', {
  id: serial('id').primaryKey(),
  transactionName: text('transaction_name').unique().notNull(),
});

export const TransactionToCategoriesRelationship = relations(
  Transaction,
  ({ many }) => ({
    categories: many(Category),
  })
);

export const TransactionToTaxCodesRelationship = relations(
  Transaction,
  ({ many }) => ({
    taxCodes: many(TaxCode),
  })
);

// Defines the key data needed to store and re-load 'For Review' Transactions.
/**
 * id: Auto assigned, used for database identification.
 * companyId: The FK that connects the FR Transaction to the Company it came from.
 * reviewTransactionId: The QuickBooks Online Id of the FR Transaction.
 * accountId: The QuickBooks Online Id of the Account the FR Transaction came from.
 * description: The 'name' of the FR Transaction.
 * origDescription: Value used only in re-submitting the FR Transaction.
 * date: The date of the FR Transaction.
 * amount: The amount of the FR Transaction.
 * acceptType: Value used only in re-submitting the FR Transaction.
 * transactionTypeId: Value used only in re-submitting the FR Transaction.
 * payeeNameId: Value used only in re-submitting the FR Transaction.
 * topCategoryClassification: The method used to idenfity the best Category Classification.
 * topCategoryClassification: The method used to idenfity the best Tax Code Classification.
 */
export const ForReviewTransaction = pgTable('ForReviewTransaction', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  companyId: text('company_id')
    .notNull()
    .references(() => Company.realmId, { onDelete: 'cascade' }),
  reviewTransactionId: text('review_transaction_id').notNull(),
  accountId: text('account_id').notNull(),
  description: text('description').notNull(),
  origDescription: text('orig_description').notNull(),
  date: text('date').notNull(),
  amount: decimal('amount').notNull(),
  acceptType: text('accept_type').notNull(),
  transactionTypeId: text('transaction_type_id').notNull(),
  payeeNameId: text('payee_name_id'),
  topCategoryClassification: text('top_category_classification').notNull(),
  topTaxCodeClassification: text('top_tax_code_classification').notNull(),
});

export const ForReviewTransactionToCategoriesRelationship = relations(
  ForReviewTransaction,
  ({ many }) => ({
    categories: many(Category),
  })
);

export const ForReviewTransactionToTaxCodesRelationship = relations(
  ForReviewTransaction,
  ({ many }) => ({
    taxCodes: many(TaxCode),
  })
);

// Defines a Category Classification that can related to either Transaction type.
/**
 * id: Auto assigned, used for database identification.
 * category: The name of the Category
 * matches: The number of times a Transaction was saved to QBO with the Category.
 */
export const Category = pgTable('Category', {
  id: serial('id').primaryKey(),
  category: text('category').unique().notNull(),
  matches: integer('matches').notNull(),
});

export const CategoryToTransactionsRelationship = relations(
  Category,
  ({ many }) => ({
    transactions: many(Transaction),
  })
);

export const CategoryToForReviewTransactionsRelationship = relations(
  Category,
  ({ many }) => ({
    reviewTransactions: many(ForReviewTransaction),
  })
);

// Defines a Tax Code Classification that can related to either Transaction type.
/**
 * id: Auto assigned, used for database identification.
 * taxCode: The name of the Tax Code.
 * matches: The number of times a Transaction was saved to QBO with the Tax Code.
 */
export const TaxCode = pgTable('TaxCode', {
  id: serial('id').primaryKey(),
  taxCode: text('tax_code').unique().notNull(),
  matches: integer('matches').notNull(),
});

export const TaxCodesToTransactionsRelationship = relations(
  TaxCode,
  ({ many }) => ({
    transactions: many(Transaction),
  })
);

export const TaxCodesToForReviewTransactionsRelationship = relations(
  TaxCode,
  ({ many }) => ({
    reviewTransactions: many(ForReviewTransaction),
  })
);

// Table to define many-to-many Relationships of Transactions and Categories.
export const TransactionsToCategories = pgTable(
  'TransactionsToCategories',
  {
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => Transaction.id),
    categoryId: integer('category_id')
      .notNull()
      .references(() => Category.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transactionId, t.categoryId] }),
  })
);

// Table to define many-to-many Relationships of Transactions and Tax Codes.
export const TransactionsToTaxCodes = pgTable(
  'TransactionsToTaxCodes',
  {
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => Transaction.id),
    taxCodeId: integer('tax_code_id')
      .notNull()
      .references(() => TaxCode.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transactionId, t.taxCodeId] }),
  })
);

// Table to define many-to-many Relationships of 'For Review' Transactions and Categories.
export const ForReviewTransactionToCategories = pgTable(
  'ForReviewTransactionsToCategories',
  {
    reviewTransactionId: uuid('review_transaction_id')
      .notNull()
      .references(() => ForReviewTransaction.id),
    categoryId: integer('category_id')
      .notNull()
      .references(() => Category.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.reviewTransactionId, t.categoryId] }),
  })
);

// Table to define many-to-many Relationships of 'For Review' Transactions and Tax Codes.
export const ForReviewTransactionToTaxCodes = pgTable(
  'ForReviewTransactionsToTaxCodes',
  {
    reviewTransactionId: uuid('review_transaction_id')
      .notNull()
      .references(() => ForReviewTransaction.id),
    taxCodeId: integer('tax_code_id')
      .notNull()
      .references(() => TaxCode.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.reviewTransactionId, t.taxCodeId] }),
  })
);
