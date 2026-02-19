import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type VotePayload = {
  captionId?: string;
  voteValue?: number;
};

const isValidVoteValue = (value: number) => value === 1 || value === -1 || value === 0;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as VotePayload;
  const captionId = body.captionId?.trim();
  const voteValue = body.voteValue;

  if (!captionId || typeof voteValue !== "number" || !isValidVoteValue(voteValue)) {
    return NextResponse.json({ error: "Invalid vote payload" }, { status: 400 });
  }

  const { data: captionRow, error: captionError } = await supabase
    .from("captions")
    .select("like_count")
    .eq("id", captionId)
    .single();

  if (captionError) {
    return NextResponse.json({ error: captionError.message }, { status: 500 });
  }

  const { data: existingVote, error: voteFetchError } = await supabase
    .from("caption_votes")
    .select("id, vote_value")
    .eq("caption_id", captionId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (voteFetchError) {
    return NextResponse.json({ error: voteFetchError.message }, { status: 500 });
  }

  const previousVote = existingVote?.vote_value ?? 0;
  const delta = voteValue - previousVote;

  if (delta === 0) {
    return NextResponse.json({
      likeCount: captionRow?.like_count ?? 0,
      userVote: previousVote,
    });
  }

  if (voteValue === 0) {
    if (existingVote?.id) {
      const { error: deleteError } = await supabase
        .from("caption_votes")
        .delete()
        .eq("id", existingVote.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }
  } else if (existingVote?.id) {
    const { error: updateVoteError } = await supabase
      .from("caption_votes")
      .update({ vote_value: voteValue, modified_datetime_utc: new Date().toISOString() })
      .eq("id", existingVote.id);

    if (updateVoteError) {
      return NextResponse.json({ error: updateVoteError.message }, { status: 500 });
    }
  } else {
    const { error: voteError } = await supabase.from("caption_votes").insert({
      caption_id: captionId,
      profile_id: user.id,
      vote_value: voteValue,
      created_datetime_utc: new Date().toISOString(),
    });

    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }
  }

  const nextLikeCount = (captionRow?.like_count ?? 0) + delta;
  const { error: updateError } = await supabase
    .from("captions")
    .update({ like_count: nextLikeCount })
    .eq("id", captionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ likeCount: nextLikeCount, userVote: voteValue });
}
