import { listOrgs, type Organization, type Role } from "@/lib/api";
import OrgsList from "./orgs-list";
import NewOrgDialog from "./new-org-dialog";

const dateFmt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateFmt.format(d);
}

const roleLabel: Record<Role, string> = {
  admin: "Yönetici",
  member: "Üye",
  viewer: "Görüntüleyici",
};

const roleBadgeClass: Record<Role, string> = {
  admin: "border-violet-400/30 bg-violet-500/15 text-violet-200",
  member: "border-zinc-400/20 bg-white/[0.04] text-zinc-200",
  viewer: "border-zinc-500/20 bg-white/[0.02] text-zinc-400",
};

export default async function OrgsPage() {
  let orgs: Organization[] = [];
  let error: string | null = null;
  try {
    orgs = await listOrgs();
  } catch (e) {
    error = e instanceof Error ? e.message : "Organizasyonlar alınamadı.";
  }

  return (
    <div className="px-8 py-6">
      <div className="flex flex-col gap-6">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
              Çalışma Alanı
            </span>
            <h2 className="text-[28px] font-medium tracking-[-0.02em] text-zinc-50">
              Organizasyonlar
            </h2>
            <p className="text-[13.5px] leading-relaxed text-zinc-300">
              Birden fazla ekiple çalışıyorsan organizasyonlarını burada yönet.
            </p>
          </div>
          <NewOrgDialog />
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

        {orgs.length === 0 && !error ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#11141b] p-12 text-center">
            <p className="text-[13.5px] text-zinc-300">
              Henüz bir organizasyona dahil değilsin. Yukarıdan{" "}
              <span className="text-violet-300">Yeni Organizasyon</span>{" "}
              oluşturarak başlayabilirsin.
            </p>
          </div>
        ) : (
          <OrgsList
            orgs={orgs.map((o) => ({
              id: o.id,
              name: o.name,
              slug: o.slug,
              role: o.role,
              roleLabel: roleLabel[o.role],
              roleBadge: roleBadgeClass[o.role],
              memberCount: o.memberCount,
              createdAt: formatDate(o.createdAt),
            }))}
          />
        )}
      </div>
    </div>
  );
}
