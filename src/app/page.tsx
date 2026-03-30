import { createClient } from "@/lib/supabase-server";
import { NavBar } from "./components/nav-bar";
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-6 font-sans dark:bg-black">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            Crackd
          </h1>
          <p className="mt-3 max-w-sm text-lg text-zinc-500 dark:text-zinc-400">
            Upload photos, generate AI captions, and vote on the best ones.
          </p>
        </div>
        <a
          href="/login"
          className="flex items-center gap-2 rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Get Started
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
    <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <NavBar currentPath="/" userEmail={user.email ?? ""} />
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Columbia Dorms
        </h1>
        {dorms && dorms.length > 0 ? (
          <div className="grid gap-3">
            {(dorms as Dorm[]).map((dorm) => (
              <div
                key={dorm.id}
                className="rounded-xl border border-zinc-200 border-l-4 border-l-blue-500 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:border-l-blue-400 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <h2 className="text-base font-medium text-black dark:text-zinc-50">
                  {dorm.short_name}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {dorm.full_name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400">No dorms found.</p>
        )}
      </main>
    </div>
  );
}
