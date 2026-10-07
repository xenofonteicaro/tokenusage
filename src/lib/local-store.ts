import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { defaultSettings, type Settings } from "./types";

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
  monthlyTokenGoal: z.number().int().positive().max(1e12).nullable(),
  subscriptions: z.object({
    codex: nullableAmount,
    claude: nullableAmount,
    grok: nullableAmount,
    gemini: nullableAmount,
  }),
  usdToBrlRate: z.number().finite().positive().max(100).optional().default(5.75),
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
      "Não foi possível ler os dados locais. Verifique o arquivo e as permissões.",
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
  return saved === null
    ? structuredClone(defaultSettings)
    : settingsSchema.parse(saved);
}
