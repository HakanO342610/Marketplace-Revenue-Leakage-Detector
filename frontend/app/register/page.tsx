"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("E-posta ve şifre zorunludur.");
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password, name || undefined);
      router.push("/upload");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Kayıt başarısız oldu.";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-57px)] w-full items-center justify-center bg-auth-canvas px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-faint opacity-40"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Erişim — Yeni Hesap
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-[24px] font-medium tracking-[-0.02em] text-slate-900">
            Hesap oluştur
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
            Birkaç saniyede hesap aç ve ilk denetimini başlat.
          </p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5">
            <Field
              id="name"
              label={
                <>
                  İsim{" "}
                  <span className="text-slate-400 normal-case tracking-normal">
                    (opsiyonel)
                  </span>
                </>
              }
              type="text"
              autoComplete="name"
              value={name}
              onChange={setName}
            />

            <Field
              id="email"
              label="E-posta"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              required
            />

            <Field
              id="password"
              label="Şifre"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              required
              minLength={8}
              hint="En az 8 karakter."
            />

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {submitting ? "Hesap açılıyor…" : "Hesap oluştur"}
            </button>
          </form>

          <p className="mt-7 text-[13px] text-slate-600">
            Zaten hesabın var mı?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-700 underline-offset-4 hover:underline"
            >
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  required,
  minLength,
  hint,
}: {
  id: string;
  label: React.ReactNode;
  type: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
      {hint && <p className="text-[12px] text-slate-500">{hint}</p>}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="relative rounded-md border border-red-200 bg-red-50 px-4 py-3 pl-5 text-[13px] text-red-700"
    >
      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-red-500"
      />
      {message}
    </div>
  );
}
