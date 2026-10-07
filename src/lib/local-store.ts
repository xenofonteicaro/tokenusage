import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { defaultSettings, type Settings } from "./types";
import { DEFAULT_USD_TO_BRL_RATE } from "./pricing/defaults";
import { LANGUAGE_CODES } from "./i18n/languages";

// Runtime user data must never be bundled into a build artifact.
export const dataDirectory = () =>
  path.resolve(
    /* turbopackIgnore: true */ process.env.TOKENUSAGE_DATA_DIR ||
      path.join(process.cwd(), ".local-data"),
  );
const nullableAmount = z.number().finite().min(0).max(1000000).nullable();
const modelPriceSchema = z.object({
  inputPer1M: z.number().finite().nonnegative(),
  outputPer1M: z.number().finite().nonnegative(),
  cacheReadPer1M: z.number().finite().nonnegative(),
});

export const settingsSchema = z.object({
  language: z.enum(LANGUAGE_CODES).optional().default("pt-BR"),
  monthlyTokenGoal: z.number().int().positive().max(1e12).nullable(),
  subscriptions: z.object({
    codex: nullableAmount,
    claude: nullableAmount,
    grok: nullableAmount,
    gemini: nullableAmount,
  }),
  usdToBrlRate: z
    .number()
    .finite()
    .positive()
    .max(100)
    .optional()
    .default(5.75),
  customPricing: z
    .record(z.string().min(1).max(100), modelPriceSchema)
    .optional()
    .default({}),
});

export async function readJson<T>(name: string): Promise<T | null> {
  try {
    return JSON.parse(
      await readFile(
        /* turbopackIgnore: true */ path.join(
          /* turbopackIgnore: true */ dataDirectory(),
          name,
        ),
        "utf8",
      ),
    ) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error(
      "Could not read local data. Check the file and permissions.",
    );
  }
}

let queue: Promise<unknown> = Promise.resolve();
export function serialized<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work, work);
  queue = result.catch(() => undefined);
  return result;
}
export async function writeJson(name: string, value: unknown): Promise<void> {
  await mkdir(dataDirectory(), { recursive: true, mode: 0o700 });
  const target = path.join(/* turbopackIgnore: true */ dataDirectory(), name);
  const temporary = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
  await rename(temporary, target);
}
export async function readSettings(): Promise<Settings> {
  const saved = await readJson<unknown>("settings.json");
  if (saved === null) return structuredClone(defaultSettings);
  // Reject invalid updates, but recover a manually edited exchange rate on read.
  if (typeof saved === "object" && saved !== null && "usdToBrlRate" in saved) {
    const rate = settingsSchema.shape.usdToBrlRate.safeParse(
      saved.usdToBrlRate,
    );
    return settingsSchema.parse({
      ...saved,
      usdToBrlRate: rate.success ? rate.data : DEFAULT_USD_TO_BRL_RATE,
    });
  }
  return settingsSchema.parse(saved);
}
