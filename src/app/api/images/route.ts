import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OwnedImage = {
  id: string;
  url: string | null;
  image_description: string | null;
  created_datetime_utc: string;
};

type OwnedCaption = {
  id: string;
  image_id: string;
  content: string | null;
  created_datetime_utc: string;
};

const OWNED_IMAGE_LIMIT = 12;

const isMissingTableError = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.message?.includes("schema cache") ||
    error.message?.includes("Could not find the table") ||
    false
  );
};

const deleteByCaptionIds = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: string,
  captionIds: string[],
) => {
  if (captionIds.length === 0) return null;
  const { error } = await supabase.from(table).delete().in("caption_id", captionIds);
  return isMissingTableError(error) ? null : error;
};

const deleteByImageId = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: string,
  imageId: string,
) => {
  const { error } = await supabase.from(table).delete().eq("image_id", imageId);
  return isMissingTableError(error) ? null : error;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: imageData, error: imageError } = await supabase
    .from("images")
    .select("id, url, image_description, created_datetime_utc")
    .eq("profile_id", user.id)
    .order("created_datetime_utc", { ascending: false })
    .limit(OWNED_IMAGE_LIMIT);

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  const images = (imageData ?? []) as OwnedImage[];
  const imageIds = images.map((image) => image.id);

  const { data: captionData, error: captionError } =
    imageIds.length > 0
      ? await supabase
          .from("captions")
          .select("id, image_id, content, created_datetime_utc")
          .in("image_id", imageIds)
          .order("created_datetime_utc", { ascending: false })
      : { data: [], error: null };

  if (captionError) {
    return NextResponse.json({ error: captionError.message }, { status: 500 });
  }

  const captions = (captionData ?? []) as OwnedCaption[];
  const captionsByImageId = new Map<string, OwnedCaption[]>();
  captions.forEach((caption) => {
    const next = captionsByImageId.get(caption.image_id) ?? [];
    next.push(caption);
    captionsByImageId.set(caption.image_id, next);
  });

  return NextResponse.json({
    uploads: images.map((image) => {
      const imageCaptions = captionsByImageId.get(image.id) ?? [];
      return {
        id: image.id,
        url: image.url,
        imageDescription: image.image_description?.trim() || "Uploaded image",
        createdAt: image.created_datetime_utc,
        captionCount: imageCaptions.length,
        latestCaption: imageCaptions[0]?.content?.trim() || null,
      };
    }),
  });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { imageId?: string } | null;
  const imageId = body?.imageId?.trim();

  if (!imageId) {
    return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
  }

  const { data: imageRow, error: imageLookupError } = await supabase
    .from("images")
    .select("id")
    .eq("id", imageId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (imageLookupError) {
    return NextResponse.json({ error: imageLookupError.message }, { status: 500 });
  }

  if (!imageRow) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const { data: captionRows, error: captionLookupError } = await supabase
    .from("captions")
    .select("id")
    .eq("image_id", imageId);

  if (captionLookupError) {
    return NextResponse.json({ error: captionLookupError.message }, { status: 500 });
  }

  const { data: requestRows, error: requestLookupError } = await supabase
    .from("caption_requests")
    .select("id")
    .eq("image_id", imageId);

  if (requestLookupError) {
    return NextResponse.json({ error: requestLookupError.message }, { status: 500 });
  }

  const captionIds = (captionRows ?? []).map((row) => row.id);
  const requestIds = (requestRows ?? []).map((row) => row.id);

  for (const table of [
    "caption_likes",
    "caption_saves",
    "caption_votes",
    "reported_captions",
    "screenshots",
    "shares",
    "study_caption_mappings",
  ]) {
    const error = await deleteByCaptionIds(supabase, table, captionIds);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (captionIds.length > 0) {
    const { error } = await supabase.from("captions").delete().in("id", captionIds);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (requestIds.length > 0) {
    const { error: llmResponseError } = await supabase
      .from("llm_model_responses")
      .delete()
      .in("caption_request_id", requestIds);
    if (llmResponseError) {
      return NextResponse.json({ error: llmResponseError.message }, { status: 500 });
    }

    const { error: llmChainError } = await supabase
      .from("llm_prompt_chains")
      .delete()
      .in("caption_request_id", requestIds);
    if (llmChainError) {
      return NextResponse.json({ error: llmChainError.message }, { status: 500 });
    }

    const { error: captionRequestError } = await supabase
      .from("caption_requests")
      .delete()
      .in("id", requestIds);
    if (captionRequestError) {
      return NextResponse.json({ error: captionRequestError.message }, { status: 500 });
    }
  }

  for (const table of [
    "caption_examples",
    "common_use_category_image_mappings",
    "reported_images",
    "study_image_set_image_mappings",
  ]) {
    const error = await deleteByImageId(supabase, table, imageId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { error: imageDeleteError } = await supabase
    .from("images")
    .delete()
    .eq("id", imageId)
    .eq("profile_id", user.id);

  if (imageDeleteError) {
    return NextResponse.json({ error: imageDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
