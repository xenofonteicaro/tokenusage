import { parseImport, mergeImports } from "@/lib/import-usage";
import { readJson, serialized, writeJson } from "@/lib/local-store";
import { isLocalRequest, privateHeaders } from "@/lib/local-security";
import type { UsageEvent } from "@/lib/types";

export async function POST(request: Request) {
  if (!isLocalRequest(request, true))
    return Response.json(
      { error: "Origem não permitida." },
      { status: 403, headers: privateHeaders },
    );
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Selecione um arquivo de consumo.");
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
          { error: "O arquivo deve ter até 4 MB." },
          { status: 413, headers: privateHeaders },
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const incoming = parseImport(text);
    const added = await serialized(async () => {
      const existing = (await readJson<UsageEvent[]>("api-usage.json")) ?? [];
      const merged = mergeImports(existing, incoming);
      if (merged.length > 100000)
        throw new Error("Limite de 100.000 registros locais atingido.");
      await writeJson("api-usage.json", merged);
      return merged.length - existing.length;
    });
    return Response.json(
      { added, processed: incoming.length },
      { headers: privateHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao importar." },
      { status: 400, headers: privateHeaders },
    );
  }
}
