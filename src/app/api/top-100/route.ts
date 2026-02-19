import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildTopRows } from "@/lib/top100";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offset = parseNumber(searchParams.get("offset"), 0);
  const limit = Math.min(
    parseNumber(searchParams.get("limit"), DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  const { error, rows } = await buildTopRows(supabase, user.id, limit, offset);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hasMore = rows.length === limit;
  const nextOffset = offset + rows.length;
  return NextResponse.json({ rows, hasMore, nextOffset });
}
