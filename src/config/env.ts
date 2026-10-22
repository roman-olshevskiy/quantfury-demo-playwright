import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv({ quiet: true });

const httpsUrl = z.url({ protocol: /^https$/ });

// Defaults are the hosts observed in docs/product-discovery.md §5. Do not add hosts that were not
// observed in the public demo mode.
const envSchema = z.object({
  BASE_URL: httpsUrl.default('https://trading.quantfury.com/'),
  DEMO_BOOTSTRAP_URL: httpsUrl.default('https://b1.trdngbcknd.com/'),
  API_BASE_URL: httpsUrl.default('https://n1.trdngbcknd.com/'),
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
