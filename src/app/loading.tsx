export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <div className="mb-10 flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="h-6 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex gap-2">
            <div className="h-8 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="mb-6 h-7 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
