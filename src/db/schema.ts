// schema.ts

import {
  pgTable,
  text,
  integer,
  serial,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const User = pgTable('User', {
  id: text('id').primaryKey().default(createId()),
  first_name: text('first_name'),
  last_name: text('last_name'),
  email: text('email').unique(),
  industry: text('industry'),
  subscriptionId: text('subscriptionId')
    .unique()
    .references(() => Subscription.id, { onDelete: 'cascade' }),
});

export const Subscription = pgTable('Subscription', {
  id: text('id').primaryKey().default(createId()),
  userId: text('userId').unique(),
  stripeId: text('stripeId').unique(),
});

export const TransactionClassification = pgTable('TransactionClassification', {
  id: serial('id').primaryKey(),
  transactionName: text('transactionName').unique(),
});

export const Classification = pgTable('Classification', {
  id: serial('id').primaryKey(),
  category: text('category').unique(),
  count: integer('count'),
});
