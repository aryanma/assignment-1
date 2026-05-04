import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { NavBar } from "@/app/components/nav-bar";
import { VoteButtons } from "./vote-buttons";
import Link from "next/link";

interface Caption {
  id: string;
  content: string;
  image_id: string | null;
}

interface CaptionVote {
  caption_id: string;
  vote_value: number;
  profile_id: string;
}

interface ImageRow {
  id: string;
  url: string;
  image_description: string | null;
}

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; image_id?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { page: pageParam, image_id: imageIdParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("captions")
    .select("id, content, image_id", { count: "exact" })
    .eq("is_public", true)
    .not("content", "is", null);

  if (imageIdParam) {
    query = query.eq("image_id", imageIdParam);
  }

  const { data: captions, error, count } = await query
    .order("created_datetime_utc", { ascending: false })
    .range(from, to);

  if (error || !captions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Failed to load captions.</p>
      </div>
    );
  }

  const captionIds = captions.map((c) => c.id);
  const imageIds = Array.from(
    new Set((captions as Caption[]).map((c) => c.image_id).filter((id): id is string => !!id))
  );
  if (imageIdParam && !imageIds.includes(imageIdParam)) {
    imageIds.push(imageIdParam);
  }

  const [{ data: votes }, { data: images }] = await Promise.all([
    captionIds.length > 0
      ? supabase
          .from("caption_votes")
          .select("caption_id, vote_value, profile_id")
          .in("caption_id", captionIds)
      : Promise.resolve({ data: [] as CaptionVote[] }),
    imageIds.length > 0
      ? supabase
          .from("images")
          .select("id, url, image_description")
          .in("id", imageIds)
      : Promise.resolve({ data: [] as ImageRow[] }),
  ]);

  const voteCounts: Record<string, number> = {};
  const userVotes: Record<string, number> = {};
  (votes as CaptionVote[] | null)?.forEach((v) => {
    voteCounts[v.caption_id] = (voteCounts[v.caption_id] || 0) + v.vote_value;
    if (v.profile_id === user.id) {
      userVotes[v.caption_id] = v.vote_value;
    }
  });

  const imageMap: Record<string, ImageRow> = {};
  (images as ImageRow[] | null)?.forEach((img) => {
    imageMap[img.id] = img;
  });

  const filterImage = imageIdParam ? imageMap[imageIdParam] : null;
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const baseHref = imageIdParam ? `/captions?image_id=${imageIdParam}&` : "/captions?";

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <NavBar currentPath="/captions" userEmail={user.email ?? ""} />
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Rate Captions
          </h1>
          {count !== null && count !== undefined && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>
          )}
        </div>

        {filterImage && (
          <div className="mb-5 flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <img
              src={filterImage.url}
              alt=""
              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-black dark:text-zinc-50">
                Captions for this image
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {filterImage.image_description ?? "No description"}
              </p>
            </div>
            <Link
              href="/captions"
              className="flex-shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Show all
            </Link>
          </div>
        )}

        {captions.length > 0 ? (
          <div className="grid gap-3">
            {(captions as Caption[]).map((caption) => {
              const image = caption.image_id ? imageMap[caption.image_id] : null;
              return (
                <div
                  key={caption.id}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex gap-4 p-5">
                    {image ? (
                      <img
                        src={image.url}
                        alt=""
                        className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                      <p className="border-l-2 border-zinc-300 pl-3 text-base italic text-black dark:border-zinc-600 dark:text-zinc-50">
                        &ldquo;{caption.content}&rdquo;
                      </p>
                      <VoteButtons
                        captionId={caption.id}
                        voteCount={voteCounts[caption.id] || 0}
                        userVote={userVotes[caption.id] || 0}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              {imageIdParam ? (
                <>
                  No public captions for this image yet.{" "}
                  <Link href="/captions" className="font-medium text-blue-500 hover:underline">
                    Show all captions
                  </Link>
                </>
              ) : (
                <>
                  No captions yet.{" "}
                  <Link href="/upload" className="font-medium text-blue-500 hover:underline">
                    Upload an image
                  </Link>{" "}
                  to generate some!
                </>
              )}
            </p>
          </div>
        )}

        {(hasPrev || hasNext) && (
          <div className="mt-8 flex items-center justify-between">
            {hasPrev ? (
              <Link
                href={`${baseHref}page=${page - 1}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {hasNext && (
              <Link
                href={`${baseHref}page=${page + 1}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
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
