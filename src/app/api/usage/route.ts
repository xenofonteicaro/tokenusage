import { buildUsagePayload } from "@/lib/usage-snapshot";
import { isLocalRequest, privateHeaders } from "@/lib/local-security";

export async function GET(request: Request) {
  if (!isLocalRequest(request))
    return Response.json(
      { error: "Access is allowed only from the local dashboard." },
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
          error instanceof Error ? error.message : "Local collection failed.",
      },
      { status: 500, headers: privateHeaders },
    );
  }
}
