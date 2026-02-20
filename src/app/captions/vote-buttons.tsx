"use client";

import { vote } from "@/app/actions";
import { useState, useTransition } from "react";

export function VoteButtons({
  captionId,
  voteCount,
  userVote,
}: {
  captionId: string;
  voteCount: number;
  userVote: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleVote(value: number) {
    setError(null);
    startTransition(async () => {
      const result = await vote(captionId, value);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">
          {voteCount} {voteCount === 1 ? "vote" : "votes"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handleVote(1)}
            disabled={isPending}
            className={`rounded-md border px-3 py-1 text-sm transition-colors disabled:opacity-50 ${
              userVote === 1
                ? "border-green-400 bg-green-100 dark:border-green-600 dark:bg-green-950"
                : "border-zinc-200 hover:bg-green-50 hover:border-green-300 dark:border-zinc-700 dark:hover:bg-green-950 dark:hover:border-green-700"
            }`}
          >
            👍 Upvote
          </button>
          <button
            onClick={() => handleVote(-1)}
            disabled={isPending}
            className={`rounded-md border px-3 py-1 text-sm transition-colors disabled:opacity-50 ${
              userVote === -1
                ? "border-red-400 bg-red-100 dark:border-red-600 dark:bg-red-950"
                : "border-zinc-200 hover:bg-red-50 hover:border-red-300 dark:border-zinc-700 dark:hover:bg-red-950 dark:hover:border-red-700"
            }`}
          >
            👎 Downvote
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
