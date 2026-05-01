"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { uploadFile, type Marketplace } from "@/lib/api";

const MARKETPLACES: Marketplace[] = [
  "trendyol",
  "hepsiburada",
  "amazon",
  "mixed",
];

export default function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [marketplace, setMarketplace] = useState<Marketplace>("mixed");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Lütfen yüklemek için bir dosya seç.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { runId } = await uploadFile(file, marketplace);
      router.push(`/dashboard/${runId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Yükleme başarısız.";
      setError(msg);
      setUploading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="file"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500"
        >
          Hakediş Dosyası
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,.xlsx,.xls,.json,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer rounded-md border border-slate-200 bg-white text-[13px] text-slate-900 placeholder:text-slate-400 file:mr-4 file:cursor-pointer file:border-0 file:bg-emerald-700 file:px-4 file:py-2.5 file:text-[12px] file:font-semibold file:text-white hover:file:bg-emerald-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        {file && (
          <p className="font-mono text-[11px] tabular-nums text-slate-500">
            {file.name} <span className="text-slate-300">·</span>{" "}
            {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="marketplace"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500"
        >
          Pazaryeri
        </label>
        <select
          id="marketplace"
          name="marketplace"
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value as Marketplace)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          {MARKETPLACES.map((m) => (
            <option key={m} value={m} className="bg-white">
              {m}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          role="alert"
          className="relative rounded-md border border-red-200 bg-red-50 px-4 py-3 pl-5 text-[13px] text-red-700"
        >
          <span
            aria-hidden
            className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-red-500"
          />
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={uploading || !file}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          <span>
            {uploading ? "Yükleniyor…" : "Yükle ve mutabakat yap"}
          </span>
          {!uploading && (
            <span aria-hidden className="font-mono">
              →
            </span>
          )}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
          CSV · XLSX · JSON
        </span>
      </div>
    </form>
  );
}
