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
        className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-800"
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
            <div className="mb-4 flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.20em] text-slate-500">
                Yeni Organizasyon
              </span>
            </div>
            <h3 className="text-[18px] font-medium tracking-[-0.01em] text-slate-900">
              Çalışma alanı oluştur
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">
              Ekibin için bir organizasyon adı belirle. Daha sonra üye davet
              edebilirsin.
            </p>

            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="org-name"
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500"
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
                  className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="relative rounded-md border border-red-200 bg-red-50 px-4 py-3 pl-5 text-[12.5px] text-red-700"
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
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
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
