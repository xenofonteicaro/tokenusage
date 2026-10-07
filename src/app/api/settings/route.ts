import {
  readSettings,
  settingsSchema,
  serialized,
  writeJson,
} from "@/lib/local-store";
import { isLocalRequest, privateHeaders } from "@/lib/local-security";

export async function GET(request: Request) {
  if (!isLocalRequest(request))
    return Response.json(
      { error: "Access is allowed only from the local dashboard." },
      { status: 403, headers: privateHeaders },
    );
  try {
    return Response.json(
      { settings: await readSettings() },
      { headers: privateHeaders },
    );
  } catch {
    return Response.json(
      { error: "Could not read local preferences." },
      { status: 500, headers: privateHeaders },
    );
  }
}

export async function PUT(request: Request) {
  if (!isLocalRequest(request, true))
    return Response.json(
      { error: "Origin not allowed." },
      { status: 403, headers: privateHeaders },
    );
  try {
    const text = await request.text();
    if (text.length > 16384)
      return Response.json(
        { error: "Settings payload is too large." },
        { status: 413, headers: privateHeaders },
      );
    const settings = settingsSchema.safeParse(JSON.parse(text));
    if (!settings.success)
      return Response.json(
        {
          error:
            "Invalid values. Enter positive numbers or leave the fields blank.",
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
      { error: "Could not save local preferences." },
      { status: 400, headers: privateHeaders },
    );
  }
}
