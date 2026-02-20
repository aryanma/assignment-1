"use client";

import { vote } from "@/app/actions";
import { useTransition } from "react";

export function VoteButtons({
  captionId,
  voteCount,
}: {
  captionId: string;
  voteCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleVote(value: number) {
    startTransition(async () => {
      await vote(captionId, value);
    });
  }

  return (
    <div className="mt-3 flex items-center justify-between">
      <span className="text-sm text-zinc-400">
        {voteCount} {voteCount === 1 ? "vote" : "votes"}
      </span>
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
    </div>
  );
}
