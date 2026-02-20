import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SignOut } from "@/app/sign-out";
import { VoteButtons } from "./vote-buttons";
import Link from "next/link";

interface Caption {
  id: string;
  content: string;
}

interface CaptionVote {
  caption_id: string;
  vote_value: number;
}

export const dynamic = "force-dynamic";

export default async function CaptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: captions, error } = await supabase
    .from("captions")
    .select("id, content")
    .eq("is_public", true)
    .not("content", "is", null)
    .order("created_datetime_utc", { ascending: false })
    .limit(20);

  if (error || !captions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Failed to load captions.</p>
      </div>
    );
  }

  const captionIds = captions.map((c) => c.id);

  const { data: votes } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value")
    .in("caption_id", captionIds);

  const voteCounts: Record<string, number> = {};
  (votes as CaptionVote[] | null)?.forEach((v) => {
    voteCounts[v.caption_id] = (voteCounts[v.caption_id] || 0) + v.vote_value;
  });

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Rate Captions
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Dorms
            </Link>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {user.email}
            </span>
            <SignOut />
          </div>
        </div>
        <div className="grid gap-4">
          {(captions as Caption[]).map((caption) => (
            <div
              key={caption.id}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="text-base text-black dark:text-zinc-50">
                {caption.content}
              </p>
              <VoteButtons
                captionId={caption.id}
                voteCount={voteCounts[caption.id] || 0}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
