import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { contentType?: string }
    | null;
  const contentType = body?.contentType?.trim();

  if (!contentType) {
    return NextResponse.json(
      { error: "Missing contentType" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Unsupported contentType" },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    "https://api.almostcrackd.ai/pipeline/generate-presigned-url",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contentType }),
    },
  );

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: payload },
      { status: upstream.status },
    );
  }

  return NextResponse.json(payload);
}
