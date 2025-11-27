import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  jsonb,
  decimal,
  integer,
  bigint,
  serial,
} from 'drizzle-orm/pg-core';

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

export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  request: jsonb('request').notNull(),
});

export const vendasCompletas = pgTable('vendas_completas', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  tipo_registro: varchar('tipo_registro', { length: 20 }).notNull(),
  id_venda: bigint('id_venda', { mode: 'number' }),
  mlb_anuncio: varchar('mlb_anuncio', { length: 50 }),
  pack_id: varchar('pack_id', { length: 50 }),
  is_pacote: boolean('is_pacote').default(false),
  titulo_item: text('titulo_item'),
  sku: varchar('sku', { length: 100 }),
  quantidade: integer('quantidade'),
  preco_unitario: decimal('preco_unitario', { precision: 12, scale: 2 }),
  total_venda_geral: decimal('total_venda_geral', { precision: 12, scale: 2 }),
  total_pago: decimal('total_pago', { precision: 12, scale: 2 }),
  moeda: varchar('moeda', { length: 10 }).default('BRL'),
  taxa_mlb_item: decimal('taxa_mlb_item', { precision: 12, scale: 2 }),
  taxa_parcelamento: decimal('taxa_parcelamento', { precision: 12, scale: 2 }),
  tipo_anuncio: varchar('tipo_anuncio', { length: 50 }),
  comprador_id: bigint('comprador_id', { mode: 'number' }),
  nome_comprador: varchar('nome_comprador', { length: 255 }),
  status_venda: varchar('status_venda', { length: 50 }),
  status_detalhe: varchar('status_detalhe', { length: 100 }),
  tipo_venda: varchar('tipo_venda', { length: 50 }),
  data_venda: timestamp('data_venda'),
  data_update: timestamp('data_update'),
  data_fechamento: timestamp('data_fechamento'),
  metodo_pagamento: varchar('metodo_pagamento', { length: 100 }),
  tipo_pagamento: varchar('tipo_pagamento', { length: 100 }),
  parcelas: integer('parcelas'),
  detalhe_parcelas: varchar('detalhe_parcelas', { length: 100 }),
  momento_aprovacao: timestamp('momento_aprovacao'),
  id_envio: bigint('id_envio', { mode: 'number' }),
  status_envio: varchar('status_envio', { length: 50 }),
  substatus_envio: varchar('substatus_envio', { length: 50 }),
  rastreio_codigo: varchar('rastreio_codigo', { length: 100 }),
  transportadora: varchar('transportadora', { length: 100 }),
  cep: varchar('cep', { length: 20 }),
  endereco_completo: text('endereco_completo'),
  cidade: varchar('cidade', { length: 100 }),
  estado: varchar('estado', { length: 100 }),
  pais: varchar('pais', { length: 100 }),
  data_criacao_envio: timestamp('data_criacao_envio'),
  data_estimada_entrega: timestamp('data_estimada_entrega'),
  data_entrega: timestamp('data_entrega'),
  frete_vendedor: decimal('frete_vendedor', { precision: 12, scale: 2 }),
  frete_comprador: decimal('frete_comprador', { precision: 12, scale: 2 }),
  frete_pago_por: varchar('frete_pago_por', { length: 100 }),
  frete_subsidio_ml: decimal('frete_subsidio_ml', { precision: 12, scale: 2 }),
  frete_custo_real: decimal('frete_custo_real', { precision: 12, scale: 2 }),
  frete_tipo_custo: varchar('frete_tipo_custo', { length: 50 }),
  data_cancelamento: timestamp('data_cancelamento'),
  motivo_cancelamento: text('motivo_cancelamento'),
  cancelado_por: varchar('cancelado_por', { length: 100 }),
  tem_reembolso: boolean('tem_reembolso').default(false),
  valor_reembolsado: decimal('valor_reembolsado', { precision: 12, scale: 2 }),
  data_reembolso: timestamp('data_reembolso'),
  id_reclamacao: bigint('id_reclamacao', { mode: 'number' }),
  motivo_reclamacao: text('motivo_reclamacao'),
  cpf: varchar('cpf', { length: 20 }),
  ads_venda: varchar('ads_venda', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});