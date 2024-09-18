// schema.ts

import {
  pgTable,
  text,
  integer,
  serial,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const User = pgTable('User', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').unique(),
  industry: text('industry'),
  companyNames: text('companyNames').array(),
  subscriptionId: uuid('subscription_id').unique(),
});

export const Subscription = pgTable('Subscription', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id')
    .unique()
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  stripeId: text('stripe_id').unique(),
});

export const Transaction = pgTable('Transaction', {
  id: serial('id').primaryKey(),
  transactionName: text('transaction_name').unique().notNull(),
});

export const TransactionToClassificationsRelationship = relations(
  Transaction,
  ({ many }) => ({
    classifications: many(Classification),
  })
);

export const TransactionToTaxCodesRelationship = relations(
  Transaction,
  ({ many }) => ({
    taxCodes: many(TaxCode),
  })
);

export const Classification = pgTable('Classification', {
  id: serial('id').primaryKey(),
  category: text('category').unique().notNull(),
  count: integer('count').notNull(),
});

export const ClassificationToTransactionsRelationship = relations(
  Classification,
  ({ many }) => ({
    transactions: many(Transaction),
  })
);

// Tax code referes to the name of the related tax code as defined in QuickBooks.
export const TaxCode = pgTable('TaxCode', {
  id: serial('id').primaryKey(),
  taxCode: text('taxCode').unique().notNull(),
  count: integer('count').notNull(),
});

export const TaxCodesToTransactionsRelationship = relations(
  TaxCode,
  ({ many }) => ({
    transactions: many(Transaction),
  })
);

export const TransactionsToClassifications = pgTable(
  'TransactionsToClassifications',
  {
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => Transaction.id),
    classificationId: integer('classification_id')
      .notNull()
      .references(() => Classification.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transactionId, t.classificationId] }),
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

// For transactions where one or both of the classifications could not be completed.
// If a related classification or taxCode is deleted from the DB, so are all related rows in this table.
export const unclassifiedUserTransaction = pgTable(
  'unclassifiedUserTransaction',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    userId: uuid('user_id')
      .unique()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    qboID: text('qboID').notNull(),
    category: text('category')
      .array()
      .references(() => Classification.category),
    taxCodeId: text('taxCode')
      .array()
      .references(() => TaxCode.taxCode),
  }
);

// For transactions where both of the classifications were assigned real values.
// If a related classification or taxCode is deleted from the DB, so are all related rows in this table.
export const classifiedUserTransaction = pgTable(
  'classifiedUserTransaction',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    userId: uuid('user_id')
      .unique()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    qboID: text('qboID').notNull(),
    category: text('category')
      .array()
      .notNull()
      .references(() => Classification.category),
    taxCode: text('taxCode')
      .array()
      .notNull()
      .references(() => TaxCode.taxCode),
  }
);
