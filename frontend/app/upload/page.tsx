import Link from "next/link";
import UploadForm from "@/components/upload-form";

export default function UploadPage() {
  return (
    <div className="px-8 py-6">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-5">
          <Link
            href="/runs"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <span aria-hidden>←</span>
            <span>Çalıştırmalar</span>
          </Link>
        </div>
        <div className="mb-6 flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
            Yeni Mutabakat
          </span>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#11141b] p-7 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
          <h2 className="text-[24px] font-medium tracking-[-0.02em] text-zinc-50">
            Pazaryeri Dosyasını Yükle
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-300">
            Hakediş dosyanı bırak, mutabakatı hemen çalıştıralım.
          </p>
          <div className="mt-7">
            <UploadForm />
          </div>
        </div>
      </div>
    </div>
  );
}
