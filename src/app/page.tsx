import { supabase } from "@/lib/supabase";

interface Dorm {
  id: number;
  short_name: string;
  full_name: string;
}

export default async function Home() {
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
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Columbia Dorms
        </h1>
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
