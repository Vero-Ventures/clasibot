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


export const unclassifiedUserTransaction = pgTable(
  'unclassifiedUserTransaction',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    userId: uuid('user_id')
      .unique()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    qboID: text('qboID').notNull(),
    classificationId: serial('')
      .array()
      .references(() => Classification.id),
    taxCodeId: serial('')
      .array()
      .references(() => TaxCode.id),
  }
);
