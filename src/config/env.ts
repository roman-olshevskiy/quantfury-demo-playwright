import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv({ quiet: true });

const envSchema = z.object({
  BASE_URL: z.url({ protocol: /^https$/ }).default('https://trading.quantfury.com/'),
  CI: z.stringbool().default(false),
  WORKERS: z.coerce.number().int().min(1).max(4).default(1),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid test configuration:\n${z.prettifyError(result.error)}\n` +
        'See .env.example for supported variables and allowed values.',
    );
  }
  return result.data;
}

export const env = parseEnv(process.env);
