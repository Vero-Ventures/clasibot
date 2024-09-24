// schema.ts

import {
  pgTable,
  primaryKey,
  uuid,
  text,
  integer,
  serial,
  boolean,
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

export const Subscription = pgTable('Subscription', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id')
    .unique()
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  stripeId: text('stripe_id').unique(),
});

export const Company = pgTable('Company', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  industry: text('industry'),
  connected: boolean('connected').notNull(),
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

// For transaction classifications to be saved for later review by the user.
export const UserTransaction = pgTable('userTransaction', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  qboID: text('qboID').notNull(),
  companyId: text('company_id')
    .notNull()
    .references(() => Company.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  date: text('date').notNull(),
  account: text('account').notNull(),
  amount: text('amount').notNull(),
  approved: boolean('approved').notNull(),
});

export const UserTransactionToClassificationsRelationship = relations(
  UserTransaction,
  ({ many }) => ({
    classifications: many(Classification),
  })
);

export const UserTransactionToTaxCodesRelationship = relations(
  UserTransaction,
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

export const ClassificationToUserTransactionsRelationship = relations(
  Classification,
  ({ many }) => ({
    transactions: many(UserTransaction),
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

export const TaxCodesToUserTransactionsRelationship = relations(
  TaxCode,
  ({ many }) => ({
    transactions: many(UserTransaction),
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

export const UserTransactionsToClassifications = pgTable(
  'UserTransactionsToClassifications',
  {
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => UserTransaction.id),
    classificationId: integer('classification_id')
      .notNull()
      .references(() => Classification.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transactionId, t.classificationId] }),
  })
);

export const UserTransactionsToTaxCodes = pgTable(
  'UserTransactionsToTaxCodes',
  {
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => UserTransaction.id),
    taxCodeId: integer('tax_code_id')
      .notNull()
      .references(() => TaxCode.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transactionId, t.taxCodeId] }),
  })
);
