import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: caption, error: captionError } = await supabase
    .from("captions")
    .select("id, content, created_datetime_utc, image_id, like_count")
    .eq("id", id)
    .maybeSingle();

  if (captionError) {
    return NextResponse.json({ error: captionError.message }, { status: 500 });
  }

  const { data: topRows, error: topError } = await supabase
    .from("captions")
    .select("id, like_count")
    .order("like_count", { ascending: false, nullsFirst: false })
    .order("created_datetime_utc", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

  if (topError) {
    return NextResponse.json({ error: topError.message }, { status: 500 });
  }

  const inTop50 = (topRows ?? []).some((row) => row.id === id);
  const rank = (topRows ?? []).findIndex((row) => row.id === id);

  return NextResponse.json({
    caption,
    inTop50,
    rank: rank === -1 ? null : rank + 1,
    top50Ids: topRows?.map((row) => row.id) ?? [],
  });
}
