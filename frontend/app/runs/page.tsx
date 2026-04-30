"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyRuns, type RunListItem } from "@/lib/api";
import { formatTRY } from "@/lib/format";

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateFmt.format(d);
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export default function RunsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyRuns();
        if (!cancelled) setRuns(data);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Çalıştırmalar alınırken bir hata oluştu.";
        setError(msg);
        setRuns([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-8 py-6">
      <div className="flex flex-col gap-6">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
              Geçmiş Denetimler
            </span>
            <h2 className="text-[28px] font-medium tracking-[-0.02em] text-zinc-50">
              Çalıştırmalar
            </h2>
            <p className="text-[13.5px] leading-relaxed text-zinc-300">
              Yüklediğin dosyalar ve tespit edilen kayıplar.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-md bg-violet-500 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-violet-400"
          >
            <span aria-hidden>+</span>
            <span>Yeni Yükleme</span>
          </Link>
        </header>

        {error && (
          <div
            role="alert"
            className="relative rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 pl-5 text-[13px] text-red-300"
          >
            <span
              aria-hidden
              className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-red-500"
            />
            {error}
          </div>
        )}

        {runs === null ? (
          <div className="rounded-xl border border-white/5 bg-[#11141b] p-8 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600">
            Yükleniyor…
          </div>
        ) : runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#11141b] p-12 text-center">
            <p className="text-[13.5px] text-zinc-400">
              Henüz yükleme yapılmadı.{" "}
              <Link
                href="/upload"
                className="font-medium text-violet-300 underline-offset-4 hover:underline"
              >
                Buraya tıklayıp ilkini başlat
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#11141b] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/5">
                  <Th>Tarih</Th>
                  <Th>Dosya</Th>
                  <Th>Run ID</Th>
                  <Th>Pazaryeri</Th>
                  <Th align="right">Satır</Th>
                  <Th align="right">Toplam Kayıp</Th>
                  <Th align="right">Durum</Th>
                  <Th align="right">{""}</Th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/dashboard/${r.id}`)}
                    className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3.5 text-[13px] tabular-nums text-zinc-200">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-[13.5px] text-zinc-50">
                      <span
                        className="block max-w-[28ch] truncate"
                        title={r.filename}
                      >
                        {r.filename}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[12px] text-zinc-300">
                      <span className="text-zinc-500">·</span>{" "}
                      {truncateId(r.id)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.10em] text-indigo-200">
                        {r.marketplace}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-zinc-100">
                      {r.rowCount.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-red-400">
                      {formatTRY(r.totalLeakage)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.10em] text-emerald-300">
                        Tamamlandı
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/dashboard/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.10em] text-zinc-400 transition-colors hover:text-violet-300"
                      >
                        <span>Aç</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const alignClass = align === "right" ? "text-right" : "text-left";
  return (
    <th
      scope="col"
      className={`px-4 py-3 ${alignClass} text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400`}
    >
      {children}
    </th>
  );
}
