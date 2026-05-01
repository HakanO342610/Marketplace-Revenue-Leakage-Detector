import Link from "next/link";
import UploadForm from "@/components/upload-form";

export default function UploadPage() {
  return (
    <div className="px-8 py-6">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-5">
          <Link
            href="/runs"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-slate-900"
          >
            <span aria-hidden>←</span>
            <span>Çalıştırmalar</span>
          </Link>
        </div>
        <div className="mb-6 flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Yeni Mutabakat
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-[24px] font-medium tracking-[-0.02em] text-slate-900">
            Pazaryeri Dosyasını Yükle
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
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
