import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  dialect: 'postgresql',
  schema: './src/infra/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
} satisfies Config;
