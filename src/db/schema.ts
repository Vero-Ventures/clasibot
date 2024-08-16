// schema.ts

import { pgTable, text, integer, serial, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const User = pgTable('User', {
  id: text('id').primaryKey().default(createId()),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').unique(),
  industry: text('industry'),
  subscriptionId: text('subscription_id')
    .unique()
    .references(() => Subscription.id, { onDelete: 'cascade' }),
});

export const Subscription = pgTable('Subscription', {
  id: text('id').primaryKey().default(createId()),
  userId: text('user_id').unique(),
  stripeId: text('stripe_id').unique(),
});

export const Transaction = pgTable('Transaction', {
  id: serial('id').primaryKey(),
  transactionName: text('transaction_name').unique(),
});

export const TransactionToClassificationsRelationship = relations(Transaction, ({ many }) => ({
  classifications: many(Classification),
}));

export const Classification = pgTable('Classification', {
  id: serial('id').primaryKey(),
  category: text('category').unique(),
  count: integer('count'),
});

const ClassificationToTransactionsRelationship = relations(Classification, ({ many }) => ({
  transactions: many(Transaction),
}));

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
  }),
);