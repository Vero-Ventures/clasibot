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
  subscriptionId: uuid('subscription_id')
    .unique()
    .references(() => Subscription.id, { onDelete: 'cascade' }),
});

export const Subscription = pgTable('Subscription', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: text('user_id').unique().notNull(),
  stripeId: uuid('stripe_id').unique().notNull(),
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
