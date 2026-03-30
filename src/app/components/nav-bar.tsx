"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Dorms" },
  { href: "/captions", label: "Captions" },
  { href: "/upload", label: "Upload" },
];

export function NavBar({
  currentPath,
  userEmail,
}: {
  currentPath: string;
  userEmail: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <nav className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-black dark:text-zinc-50"
        >
          Crackd
        </Link>
        <div className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                currentPath === link.href
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:inline">
          {userEmail}
        </span>
        <button
          onClick={handleSignOut}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
