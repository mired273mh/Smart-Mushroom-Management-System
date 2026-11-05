import 'dotenv/config';
import { z } from 'zod';

export function readConfig(env = process.env) {
  return z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().url().refine(v => /^postgres(ql)?:/.test(v)),
    WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(1).default(0),
  }).parse(env);
}
