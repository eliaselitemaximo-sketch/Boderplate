import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb } from 'drizzle-orm/pg-core';

export const userMarketplace = pgTable('user_marketplace', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  createdIn: timestamp('created_in').defaultNow(),
  status: boolean('status').default(true),
  accessToken: varchar('access_token', { length: 500 }),
  refreshToken: varchar('refresh_token', { length: 500 }),
});

export const authMercadolivre = pgTable('auth_mercadolivre', {
  userMarketplaceId: uuid('user_marketplace_id')
    .primaryKey()
    .references(() => userMarketplace.id, { onDelete: 'cascade' }),
  scope: text('scope'),
  userId: varchar('user_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const authShopee = pgTable('auth_shopee', {
  userMarketplaceId: uuid('user_marketplace_id')
    .primaryKey()
    .references(() => userMarketplace.id, { onDelete: 'cascade' }),
  shopId: varchar('shop_id', { length: 255 }),
  mainAccountId: varchar('main_account_id', { length: 255 }),
  merchantIdList: text('merchant_id_list'),
  shpIdList: text('shp_id_list'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const authTiktokshop = pgTable('auth_tiktokshop', {
  userMarketplaceId: uuid('user_marketplace_id')
    .primaryKey()
    .references(() => userMarketplace.id, { onDelete: 'cascade' }),
  scope: text('scope'),
  userId: varchar('user_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
/*
export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  request: jsonb('request').notNull(),
});
*/