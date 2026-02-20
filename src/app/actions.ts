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

  const { error } = await supabase.from("caption_votes").insert({
    vote_value: voteValue,
    profile_id: user.id,
    caption_id: captionId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/captions");
  return { success: true };
}
