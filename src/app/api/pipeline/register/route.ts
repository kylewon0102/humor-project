import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { imageUrl?: string; isCommonUse?: boolean }
    | null;
  const imageUrl = body?.imageUrl?.trim();
  const isCommonUse = Boolean(body?.isCommonUse);

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
  }

  const upstream = await fetch(
    "https://api.almostcrackd.ai/pipeline/upload-image-from-url",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl, isCommonUse }),
    },
  );

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Failed to register image", details: payload },
      { status: upstream.status },
    );
  }

  return NextResponse.json(payload);
}
