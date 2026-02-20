"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

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
