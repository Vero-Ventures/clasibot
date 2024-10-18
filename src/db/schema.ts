// schema.ts

import {
  pgTable,
  primaryKey,
  uuid,
  text,
  integer,
  boolean,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const User = pgTable('User', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').unique(),
  subscriptionId: uuid('subscription_id').unique(),
});

export const UserToCompanyRelations = relations(User, ({ many }) => ({
  companies: many(Company),
}));

export const Firm = pgTable('Firm', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id').references(() => User.id, { onDelete: 'cascade' }),
  userName: text('user_name').notNull(),
  name: text('name').notNull(),
});

export const Subscription = pgTable('Subscription', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id')
    .unique()
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  stripeId: text('stripe_id').unique(),
});

export const Company = pgTable('Company', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  realmId: text('realm_id').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  industry: text('industry'),
  bookkeeperConnected: boolean('bookkeeper_connected').notNull(),
  firmName: text('firm_name'),
  classificationFailed: boolean('classification_failed'),
});

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

export const ForReviewTransaction = pgTable('ForReviewTransaction', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  companyId: text('company_id')
    .notNull()
    .references(() => Company.realmId, { onDelete: 'cascade' }),
  transactionId: text('transaction_id').notNull(),
  accountId: text('account_id').notNull(),
  description: text('description').notNull(),
  origDescription: text('orig_description').notNull(),
  date: text('date').notNull(),
  amount: integer('amount').notNull(),
  acceptType: text('accept_type').notNull(),
  transactionTypeId: text('transaction_type_id').notNull(),
  payeeNameId: text('payee_name_id'),
  topCategoryClassification: text('top_classification').notNull(),
  topTaxCodeClassification: text('top_classification').notNull(),
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
    transactions: many(ForReviewTransaction),
  })
);

export const TaxCode = pgTable('TaxCode', {
  id: serial('id').primaryKey(),
  taxCode: text('taxCode').unique().notNull(),
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
    transactions: many(ForReviewTransaction),
  })
);

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

export const ForReviewTransactionToCategories = pgTable(
  'ForReviewTransactionsToCategories',
  {
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => ForReviewTransaction.id),
    categoryId: integer('category_id')
      .notNull()
      .references(() => Category.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transactionId, t.categoryId] }),
  })
);

export const ForReviewTransactionToTaxCodes = pgTable(
  'ForReviewTransactionsToTaxCodes',
  {
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => ForReviewTransaction.id),
    taxCodeId: integer('tax_code_id')
      .notNull()
      .references(() => TaxCode.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transactionId, t.taxCodeId] }),
  })
);

export const NextReviewTimestamp = pgTable('NextReviewTimestamp', {
  id: serial('id').primaryKey(),
  date: timestamp('date', { withTimezone: true }).notNull(),
});
