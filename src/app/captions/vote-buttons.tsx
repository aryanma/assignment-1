"use client";

import { vote } from "@/app/actions";
import { useState, useTransition } from "react";

export function VoteButtons({ captionId }: { captionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [voted, setVoted] = useState<number | null>(null);

  function handleVote(value: number) {
    startTransition(async () => {
      const result = await vote(captionId, value);
      if (!result.error) {
        setVoted(value);
      }
    });
  }

  if (voted !== null) {
    return (
      <span className="text-sm text-zinc-500">
        {voted === 1 ? "👍 Upvoted" : "👎 Downvoted"}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={isPending}
        className="rounded-md border border-zinc-200 px-3 py-1 text-sm transition-colors hover:bg-green-50 hover:border-green-300 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-green-950 dark:hover:border-green-700"
      >
        👍 Upvote
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={isPending}
        className="rounded-md border border-zinc-200 px-3 py-1 text-sm transition-colors hover:bg-red-50 hover:border-red-300 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-red-950 dark:hover:border-red-700"
      >
        👎 Downvote
      </button>
    </div>
  );
}
