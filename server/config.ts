import { z } from 'zod';

const DEFAULT_MODELS = 'gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.8-flash';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODELS: z.string().default(DEFAULT_MODELS),
  /** Set by Cloud Run; its presence switches the pattern counter to Firestore. */
  K_SERVICE: z.string().optional(),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(20),
  CACHE_SIZE: z.coerce.number().int().positive().default(500),
});

export type Config = ReturnType<typeof loadConfig>;

/** Reads and validates the environment once at startup. */
export const loadConfig = (env: NodeJS.ProcessEnv = process.env) => {
  const parsed = envSchema.parse(env);
  return {
    port: parsed.PORT,
    geminiKey: parsed.GEMINI_API_KEY?.trim() ?? '',
    models: parsed.GEMINI_MODELS.split(',').map((m) => m.trim()).filter(Boolean),
    onCloudRun: parsed.K_SERVICE !== undefined,
    ratePerMinute: parsed.RATE_LIMIT_PER_MINUTE,
    cacheSize: parsed.CACHE_SIZE,
  };
};
