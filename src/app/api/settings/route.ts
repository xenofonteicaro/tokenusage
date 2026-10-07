import { settingsSchema, serialized, writeJson } from "@/lib/local-store";
import { isLocalRequest, privateHeaders } from "@/lib/local-security";

export async function PUT(request: Request) {
  if (!isLocalRequest(request, true))
    return Response.json(
      { error: "Origem não permitida." },
      { status: 403, headers: privateHeaders },
    );
  try {
    const text = await request.text();
    if (text.length > 16384)
      return Response.json(
        { error: "Configuração muito grande." },
        { status: 413, headers: privateHeaders },
      );
    const settings = settingsSchema.safeParse(JSON.parse(text));
    if (!settings.success)
      return Response.json(
        {
          error:
            "Valores inválidos. Informe números positivos ou deixe os campos vazios.",
        },
        { status: 400, headers: privateHeaders },
      );
    await serialized(() => writeJson("settings.json", settings.data));
    return Response.json(
      { settings: settings.data },
      { headers: privateHeaders },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível salvar as preferências locais." },
      { status: 400, headers: privateHeaders },
    );
  }
}
