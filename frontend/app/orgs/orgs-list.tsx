"use client";

import { useRouter } from "next/navigation";
import { setCurrentOrgId } from "@/lib/api";

type CardOrg = {
  id: string;
  name: string;
  slug: string;
  role: string;
  roleLabel: string;
  roleBadge: string;
  memberCount: number;
  createdAt: string;
};

export default function OrgsList({ orgs }: { orgs: CardOrg[] }) {
  const router = useRouter();

  function pick(orgId: string) {
    setCurrentOrgId(orgId);
    router.refresh();
    router.push("/runs");
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {orgs.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => pick(o.id)}
          className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-slate-900">
                {o.name}
              </span>
              <span className="font-mono text-[11.5px] text-slate-500">
                {o.slug}
              </span>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.10em] ${o.roleBadge}`}
            >
              {o.roleLabel}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-[12.5px] text-slate-500">
              <span className="tabular-nums text-slate-700">
                {o.memberCount}
              </span>{" "}
              üye
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 group-hover:text-emerald-700">
              Geç →
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
