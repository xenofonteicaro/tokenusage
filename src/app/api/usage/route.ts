import { buildUsagePayload } from "@/lib/usage-snapshot";
import { isLocalRequest, privateHeaders } from "@/lib/local-security";

export async function GET(request: Request) {
  if (!isLocalRequest(request))
    return Response.json(
      { error: "Acesso permitido apenas pela dashboard local." },
      { status: 403, headers: privateHeaders },
    );
  try {
    return Response.json(await buildUsagePayload(), {
      headers: privateHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha na coleta local.",
      },
      { status: 500, headers: privateHeaders },
    );
  }
}
