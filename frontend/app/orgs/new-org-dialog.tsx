"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createOrg, setCurrentOrgId } from "@/lib/api";

export default function NewOrgDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setError(null);
    setSubmitting(false);
  }

  function close() {
    if (submitting) return;
    setOpen(false);
    reset();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Organizasyon adı en az 2 karakter olmalı.");
      return;
    }
    setSubmitting(true);
    try {
      const org = await createOrg(trimmed);
      setCurrentOrgId(org.id);
      router.push(`/orgs/${org.slug}/members`);
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Organizasyon oluşturulamadı.";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-violet-500 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-violet-400"
      >
        <span aria-hidden>+</span>
        <span>Yeni Organizasyon</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Yeni organizasyon"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <button
            type="button"
            aria-label="Kapat"
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#11141b] p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
            <div className="mb-4 flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.20em] text-zinc-500">
                Yeni Organizasyon
              </span>
            </div>
            <h3 className="text-[18px] font-medium tracking-[-0.01em] text-zinc-50">
              Çalışma alanı oluştur
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-400">
              Ekibin için bir organizasyon adı belirle. Daha sonra üye davet
              edebilirsin.
            </p>

            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="org-name"
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500"
                >
                  Organizasyon adı
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="örn. Acme Ticaret"
                  autoFocus
                  className="rounded-md border border-white/10 bg-[#0e1119] px-3 py-2.5 text-[13.5px] text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/15"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="relative rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 pl-5 text-[12.5px] text-red-300"
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-red-500"
                  />
                  {error}
                </div>
              )}

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={submitting}
                  className="rounded-md border border-white/10 bg-white/[0.02] px-4 py-2 text-[12.5px] font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-100 disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-md bg-violet-500 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
                >
                  {submitting ? "Oluşturuluyor…" : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
