"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

const API_BASE = "https://api.almostcrackd.ai";

async function getAccessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

export async function getPresignedUrl(contentType: string) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType }),
  });
  if (!res.ok) return { error: `Failed to get presigned URL: ${res.status}` };
  return await res.json();
}

export async function registerImage(cdnUrl: string) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
  });
  if (!res.ok) return { error: `Failed to register image: ${res.status}` };
  return await res.json();
}

export async function generateCaptions(imageId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageId }),
  });
  if (!res.ok) return { error: `Failed to generate captions: ${res.status}` };
  return await res.json();
}

export async function vote(captionId: string, voteValue: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: existing } = await supabase
    .from("caption_votes")
    .select("id, vote_value")
    .eq("profile_id", user.id)
    .eq("caption_id", captionId)
    .maybeSingle();

  let error;

  if (existing && existing.vote_value === voteValue) {
    // Same vote clicked again — remove it
    ({ error } = await supabase
      .from("caption_votes")
      .delete()
      .eq("id", existing.id));
  } else if (existing) {
    // Switching vote
    ({ error } = await supabase
      .from("caption_votes")
      .update({
        vote_value: voteValue,
        modified_datetime_utc: new Date().toISOString(),
      })
      .eq("id", existing.id));
  } else {
    // New vote
    ({ error } = await supabase.from("caption_votes").insert({
      vote_value: voteValue,
      profile_id: user.id,
      caption_id: captionId,
      created_datetime_utc: new Date().toISOString(),
    }));
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/captions");
  return { success: true };
}
