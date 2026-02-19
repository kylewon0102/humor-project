import type { SupabaseClient } from "@supabase/supabase-js";

type RecentCaption = {
  id: string;
  content: string | null;
  created_datetime_utc: string;
  image_id: string | null;
  like_count: number | null;
};

type RecentImage = {
  id: string;
  url: string | null;
  image_description: string | null;
};

export type RecentRow = {
  id: string;
  content: string | null;
  created_datetime_utc: string;
  imageId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  imageStatus: "ok" | "missing_image_row" | "missing_image_url";
  likeCount: number;
  userVote: number;
};

type BuildRecentRowsResult = {
  error: { message: string } | null;
  rows: RecentRow[];
  hasMore: boolean;
  nextOffset: number;
};

const BATCH_MULTIPLIER = 4;

export const buildRecentRows = async (
  supabase: SupabaseClient,
  userId: string,
  limit: number,
  offset: number,
): Promise<BuildRecentRowsResult> => {
  const batchSize = limit * BATCH_MULTIPLIER;
  let cursor = offset;
  const collected: RecentRow[] = [];

  while (true) {
    const rangeStart = cursor;
    const rangeEnd = rangeStart + batchSize - 1;
    const { data, error } = await supabase
      .from("captions")
      .select("id, content, created_datetime_utc, image_id, like_count")
      .order("created_datetime_utc", { ascending: false })
      .order("id", { ascending: false })
      .range(rangeStart, rangeEnd);

    if (error) {
      return { error, rows: [], hasMore: false, nextOffset: cursor };
    }

    const rows = (data ?? []) as RecentCaption[];
    if (rows.length === 0) {
      return {
        error: null,
        rows: collected,
        hasMore: false,
        nextOffset: cursor,
      };
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

    const imagesById = new Map<string, RecentImage>(
      (imageData ?? []).map((image) => [image.id, image]),
    );
    const votesByCaptionId = new Map<string, number>(
      (voteData ?? []).map((vote) => [vote.caption_id, vote.vote_value]),
    );

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const image = row.image_id ? imagesById.get(row.image_id) : undefined;
      if (!image?.url) {
        continue;
      }
      collected.push({
        id: row.id,
        content: row.content,
        created_datetime_utc: row.created_datetime_utc,
        imageId: row.image_id,
        imageUrl: image.url,
        imageAlt: image.image_description?.trim() || "Caption image",
        imageStatus: "ok",
        likeCount: row.like_count ?? 0,
        userVote: votesByCaptionId.get(row.id) ?? 0,
      });
      if (collected.length === limit) {
        return {
          error: null,
          rows: collected,
          hasMore: true,
          nextOffset: cursor + i + 1,
        };
      }
    }

    cursor += rows.length;
    if (rows.length < batchSize) {
      break;
    }
  }

  return { error: null, rows: collected, hasMore: false, nextOffset: cursor };
};
