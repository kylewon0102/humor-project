import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecentRow } from "./recent";

type TopCaption = {
  id: string;
  content: string | null;
  created_datetime_utc: string;
  image_id: string | null;
  like_count: number | null;
};

type TopImage = {
  id: string;
  url: string | null;
  image_description: string | null;
};

type BuildTopRowsResult = {
  error: { message: string } | null;
  rows: RecentRow[];
};

export const buildTopRows = async (
  supabase: SupabaseClient,
  userId: string,
  limit: number,
  offset: number,
): Promise<BuildTopRowsResult> => {
  const rangeStart = offset;
  const rangeEnd = rangeStart + limit - 1;
  const { data, error } = await supabase
    .from("captions")
    .select("id, content, created_datetime_utc, image_id, like_count")
    .order("like_count", { ascending: false, nullsFirst: false })
    .order("created_datetime_utc", { ascending: false })
    .order("id", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) {
    return { error, rows: [] };
  }

  const rows = (data ?? []) as TopCaption[];
  if (rows.length === 0) {
    return { error: null, rows: [] };
  }

  const imageIds = rows
    .map((row) => row.image_id)
    .filter((value): value is string => Boolean(value));
  const captionIds = rows.map((row) => row.id);

  const { data: imageData } =
    imageIds.length > 0
      ? await supabase
          .from("images")
          .select("id, url, image_description")
          .in("id", imageIds)
      : { data: [] };

  const { data: voteData } =
    captionIds.length > 0
      ? await supabase
          .from("caption_votes")
          .select("caption_id, vote_value")
          .in("caption_id", captionIds)
          .eq("profile_id", userId)
      : { data: [] };

  const imagesById = new Map<string, TopImage>(
    (imageData ?? []).map((image) => [image.id, image]),
  );
  const votesByCaptionId = new Map<string, number>(
    (voteData ?? []).map((vote) => [vote.caption_id, vote.vote_value]),
  );

  const topRows: RecentRow[] = rows.map((row) => {
    const image = row.image_id ? imagesById.get(row.image_id) : undefined;
    let imageStatus: RecentRow["imageStatus"];
    if (!row.image_id || !image) {
      imageStatus = "missing_image_row";
    } else if (!image.url) {
      imageStatus = "missing_image_url";
    } else {
      imageStatus = "ok";
    }
    return {
      id: row.id,
      content: row.content,
      created_datetime_utc: row.created_datetime_utc,
      imageId: row.image_id,
      imageUrl: image?.url ?? null,
      imageAlt: image?.image_description?.trim() || "Caption image",
      imageStatus,
      likeCount: row.like_count ?? 0,
      userVote: votesByCaptionId.get(row.id) ?? 0,
    };
  });

  return { error: null, rows: topRows };
};
