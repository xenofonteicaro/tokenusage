import {
  parseImport,
  mergeImports,
  upgradeLegacyLabels,
} from "@/lib/import-usage";
import { readJson, serialized, writeJson } from "@/lib/local-store";
import { isLocalRequest, privateHeaders } from "@/lib/local-security";
import type { UsageEvent } from "@/lib/types";

export async function POST(request: Request) {
  if (!isLocalRequest(request, true))
    return Response.json(
      { error: "Origin not allowed." },
      { status: 403, headers: privateHeaders },
    );
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Select a usage file.");
    const decoder = new TextDecoder();
    let text = "",
      size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4 * 1024 * 1024) {
        await reader.cancel();
        return Response.json(
          { error: "The file must be no larger than 4 MB." },
          { status: 413, headers: privateHeaders },
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const incoming = parseImport(text);
    const added = await serialized(async () => {
      const existing = (await readJson<UsageEvent[]>("api-usage.json")) ?? [];
      const merged = mergeImports(upgradeLegacyLabels(existing), incoming);
      if (merged.length > 100000)
        throw new Error("The limit of 100,000 local records has been reached.");
      await writeJson("api-usage.json", merged);
      return merged.length - existing.length;
    });
    return Response.json(
      { added, processed: incoming.length },
      { headers: privateHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      { status: 400, headers: privateHeaders },
    );
  }
}
