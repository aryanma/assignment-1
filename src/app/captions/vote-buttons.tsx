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
  const [toast, setToast] = useState<string | null>(null);

  function handleVote(value: number) {
    setError(null);
    setToast(null);
    startTransition(async () => {
      const result = await vote(captionId, value);
      if (result.error) {
        setError(result.error);
      } else {
        setToast(
          userVote === value ? "Vote removed" : value === 1 ? "Upvoted!" : "Downvoted!"
        );
        setTimeout(() => setToast(null), 2000);
      }
    });
  }

  const countColor =
    voteCount > 0
      ? "text-green-600 dark:text-green-400"
      : voteCount < 0
        ? "text-red-500 dark:text-red-400"
        : "text-zinc-400";

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${countColor}`}>
            {voteCount > 0 ? "+" : ""}
            {voteCount}
          </span>
          {toast && (
            <span className="animate-fade-in text-xs text-zinc-500 dark:text-zinc-400">
              {toast}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleVote(1)}
            disabled={isPending}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-all disabled:opacity-50 ${
              userVote === 1
                ? "border-green-400 bg-green-100 shadow-sm dark:border-green-600 dark:bg-green-950"
                : "border-zinc-200 hover:bg-green-50 hover:border-green-300 dark:border-zinc-700 dark:hover:bg-green-950 dark:hover:border-green-700"
            }`}
          >
            👍
          </button>
          <button
            onClick={() => handleVote(-1)}
            disabled={isPending}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-all disabled:opacity-50 ${
              userVote === -1
                ? "border-red-400 bg-red-100 shadow-sm dark:border-red-600 dark:bg-red-950"
                : "border-zinc-200 hover:bg-red-50 hover:border-red-300 dark:border-zinc-700 dark:hover:bg-red-950 dark:hover:border-red-700"
            }`}
          >
            👎
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
