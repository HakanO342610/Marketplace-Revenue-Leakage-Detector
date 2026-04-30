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
          className="group flex flex-col gap-4 rounded-xl border border-white/5 bg-[#11141b] p-5 text-left transition-colors hover:border-violet-400/30 hover:bg-[#141824]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-50">
                {o.name}
              </span>
              <span className="font-mono text-[11.5px] text-zinc-400">
                {o.slug}
              </span>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.10em] ${o.roleBadge}`}
            >
              {o.roleLabel}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <span className="text-[12.5px] text-zinc-300">
              <span className="tabular-nums text-zinc-100">
                {o.memberCount}
              </span>{" "}
              üye
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 group-hover:text-violet-300">
              Geç →
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
