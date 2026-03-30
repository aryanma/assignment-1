"use client";

import { getPresignedUrl, registerImage, generateCaptions } from "@/app/actions";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Caption {
  id: string;
  content: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setCaptions([]);
    setError("");
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");
    setCaptions([]);

    try {
      // Step 1: Get presigned URL
      setStatus("Getting upload URL...");
      const presigned = await getPresignedUrl(file.type);
      if (presigned.error) throw new Error(presigned.error);

      // Step 2: Upload to S3
      setStatus("Uploading image...");
      const uploadRes = await fetch(presigned.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload image to storage");

      // Step 3: Register image
      setStatus("Registering image...");
      const registered = await registerImage(presigned.cdnUrl);
      if (registered.error) throw new Error(registered.error);

      // Step 4: Generate captions
      setStatus("Generating captions...");
      const result = await generateCaptions(registered.imageId);
      if (result.error) throw new Error(result.error);

      setCaptions(Array.isArray(result) ? result : []);
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Upload Image
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Dorms
            </Link>
            <Link
              href="/captions"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Captions
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-md border-2 border-dashed border-zinc-300 px-6 py-12 text-center text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
          >
            {file ? file.name : "Click to select an image"}
          </button>

          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-4 max-h-64 w-full rounded-md object-contain"
            />
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-4 w-full rounded-md bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? status : "Generate Captions"}
          </button>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        {captions.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
              Generated Captions
            </h2>
            <div className="grid gap-3">
              {captions.map((caption, i) => (
                <div
                  key={caption.id || i}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-base text-black dark:text-zinc-50">
                    {caption.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
