import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { NavBar } from "@/app/components/nav-bar";
import { VoteButtons } from "./vote-buttons";
import Link from "next/link";

interface Caption {
  id: string;
  content: string;
}

interface CaptionVote {
  caption_id: string;
  vote_value: number;
  profile_id: string;
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
    .select("caption_id, vote_value, profile_id")
    .in("caption_id", captionIds);

  const voteCounts: Record<string, number> = {};
  const userVotes: Record<string, number> = {};
  (votes as CaptionVote[] | null)?.forEach((v) => {
    voteCounts[v.caption_id] = (voteCounts[v.caption_id] || 0) + v.vote_value;
    if (v.profile_id === user.id) {
      userVotes[v.caption_id] = v.vote_value;
    }
  });

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <NavBar currentPath="/captions" userEmail={user.email ?? ""} />
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Rate Captions
        </h1>
        {captions.length > 0 ? (
          <div className="grid gap-3">
            {(captions as Caption[]).map((caption) => (
              <div
                key={caption.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="border-l-2 border-zinc-300 pl-3 text-base italic text-black dark:border-zinc-600 dark:text-zinc-50">
                  &ldquo;{caption.content}&rdquo;
                </p>
                <VoteButtons
                  captionId={caption.id}
                  voteCount={voteCounts[caption.id] || 0}
                  userVote={userVotes[caption.id] || 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              No captions yet.{" "}
              <Link href="/upload" className="font-medium text-blue-500 hover:underline">
                Upload an image
              </Link>{" "}
              to generate some!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
