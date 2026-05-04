import { createClient } from "@/lib/supabase-server";
import { NavBar } from "./components/nav-bar";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ImageRow {
  id: string;
  url: string;
  image_description: string | null;
  created_datetime_utc: string;
}

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
const FETCH_BATCH = 1000;

async function getAllImageIdsWithPublicCaptions(supabase: SupabaseClient): Promise<string[]> {
  const ordered: string[] = [];
  const seen = new Set<string>();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("captions")
      .select("image_id, created_datetime_utc")
      .eq("is_public", true)
      .not("image_id", "is", null)
      .order("created_datetime_utc", { ascending: false })
      .range(from, from + FETCH_BATCH - 1);
    if (error || !data || data.length === 0) break;
    for (const c of data as { image_id: string }[]) {
      if (c.image_id && !seen.has(c.image_id)) {
        seen.add(c.image_id);
        ordered.push(c.image_id);
      }
    }
    if (data.length < FETCH_BATCH) break;
    from += FETCH_BATCH;
  }
  return ordered;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
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

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const orderedImageIds = await getAllImageIdsWithPublicCaptions(supabase);

  if (orderedImageIds.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
        <main className="mx-auto max-w-5xl">
          <NavBar currentPath="/" userEmail={user.email ?? ""} />
          <h1 className="mb-6 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Image Gallery
          </h1>
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              No images with published captions yet.{" "}
              <Link href="/upload" className="font-medium text-blue-500 hover:underline">
                Upload one
              </Link>{" "}
              to get started.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(orderedImageIds.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const pagedIds = orderedImageIds.slice(from, from + PAGE_SIZE);

  const { data: imagesData } = await supabase
    .from("images")
    .select("id, url, image_description, created_datetime_utc")
    .in("id", pagedIds);

  const imageMap: Record<string, ImageRow> = {};
  (imagesData as ImageRow[] | null)?.forEach((img) => {
    imageMap[img.id] = img;
  });

  const pagedImages = pagedIds
    .map((id) => imageMap[id])
    .filter((img): img is ImageRow => !!img);

  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <main className="mx-auto max-w-5xl">
        <NavBar currentPath="/" userEmail={user.email ?? ""} />
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Image Gallery
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Click any image to see and rate its captions.
            </p>
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Page {safePage} of {totalPages}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {pagedImages.map((img) => (
            <Link
              key={img.id}
              href={`/captions?image_id=${img.id}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <img
                src={img.url}
                alt={img.image_description ?? ""}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs font-medium text-white">View captions →</p>
              </div>
            </Link>
          ))}
        </div>

        {(hasPrev || hasNext) && (
          <div className="mt-8 flex items-center justify-between">
            {hasPrev ? (
              <Link
                href={`/?page=${safePage - 1}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {hasNext && (
              <Link
                href={`/?page=${safePage + 1}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
