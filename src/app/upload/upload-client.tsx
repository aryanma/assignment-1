"use client";

import { getPresignedUrl, registerImage, generateCaptions } from "@/app/actions";
import { useState, useRef } from "react";
import { NavBar } from "@/app/components/nav-bar";
import Link from "next/link";

interface Caption {
  id: string;
  content: string;
}

const STEPS = [
  "Getting upload URL",
  "Uploading image",
  "Registering image",
  "Generating captions",
];

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i < currentStep
                  ? "bg-green-500 text-white"
                  : i === currentStep
                    ? "animate-pulse bg-black text-white dark:bg-white dark:text-black"
                    : "bg-zinc-200 text-zinc-400 dark:bg-zinc-700"
              }`}
            >
              {i < currentStep ? "\u2713" : i + 1}
            </div>
            <span
              className={`hidden text-xs sm:inline ${
                i <= currentStep
                  ? "text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-4 ${
                i < currentStep ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function UploadClient({ userEmail }: { userEmail: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setCaptions([]);
    setError("");
    setStep(-1);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");
    setCaptions([]);

    try {
      setStep(0);
      const presigned = await getPresignedUrl(file.type);
      if (presigned.error) throw new Error(presigned.error);

      setStep(1);
      const uploadRes = await fetch(presigned.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload image to storage");

      setStep(2);
      const registered = await registerImage(presigned.cdnUrl);
      if (registered.error) throw new Error(registered.error);

      setStep(3);
      const result = await generateCaptions(registered.imageId);
      if (result.error) throw new Error(result.error);

      setCaptions(Array.isArray(result) ? result : []);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <NavBar currentPath="/upload" userEmail={userEmail} />

        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Upload Image
        </h1>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-6 py-12 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
          >
            <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {file ? file.name : "Click to select an image"}
            </span>
          </button>

          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-4 max-h-64 w-full rounded-lg object-contain"
            />
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-4 w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Processing..." : "Generate Captions"}
          </button>

          {loading && step >= 0 && <Stepper currentStep={step} />}
          {!loading && step === 4 && <Stepper currentStep={4} />}

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        {captions.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                Generated Captions
              </h2>
              <Link
                href="/captions"
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                View all captions &rarr;
              </Link>
            </div>
            <div className="grid gap-3">
              {captions.map((caption, i) => (
                <div
                  key={caption.id || i}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-base text-black dark:text-zinc-50">
                    &ldquo;{caption.content}&rdquo;
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
