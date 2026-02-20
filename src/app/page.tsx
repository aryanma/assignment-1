import { createClient } from "@/lib/supabase-server";
import { SignOut } from "./sign-out";
import Link from "next/link";

interface Dorm {
  id: number;
  short_name: string;
  full_name: string;
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 font-sans dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Columbia Dorms
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Sign in to view the dorms directory.
        </p>
        <a
          href="/login"
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Sign in with Google
        </a>
      </div>
    );
  }

  const { data: dorms, error } = await supabase
    .from("dorms")
    .select("id, short_name, full_name")
    .order("id");

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Failed to load dorms.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Columbia Dorms
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/captions"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Captions
            </Link>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {user.email}
            </span>
            <SignOut />
          </div>
        </div>
        <div className="grid gap-4">
          {(dorms as Dorm[]).map((dorm) => (
            <div
              key={dorm.id}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                {dorm.short_name}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {dorm.full_name}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
