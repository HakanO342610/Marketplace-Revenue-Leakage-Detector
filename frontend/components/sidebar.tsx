"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  currentOrgId,
  listOrgs,
  setCurrentOrgId,
  type Organization,
  type Role,
} from "@/lib/api";

type IconKey =
  | "dashboard"
  | "runs"
  | "upload"
  | "members"
  | "orgs"
  | "settings"
  | "help";

type NavItem = {
  label: string;
  href: string;
  icon: IconKey;
  disabled?: boolean;
  adminOnly?: boolean;
  matches?: (pathname: string) => boolean;
};

function NavIcon({ name }: { name: IconKey }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "runs":
      return (
        <svg {...props}>
          <path d="M3 18h4l3-12 4 18 3-9h4" />
        </svg>
      );
    case "upload":
      return (
        <svg {...props}>
          <path d="M12 3v13" />
          <path d="M7 8l5-5 5 5" />
          <path d="M5 21h14" />
        </svg>
      );
    case "members":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 14.2c2.6.4 4.5 2.5 4.5 5.3" />
        </svg>
      );
    case "orgs":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="8" height="15" rx="1.2" />
          <rect x="13" y="3" width="8" height="18" rx="1.2" />
          <path d="M6 10h2M6 14h2M6 18h2" />
          <path d="M16 7h2M16 11h2M16 15h2" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case "help":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" />
        </svg>
      );
  }
}

const ROLE_LABEL: Record<Role, string> = {
  admin: "Yönetici",
  member: "Üye",
  viewer: "Görüntüleyici",
};

const HIDE_ON: readonly string[] = ["/", "/login", "/register", "/landing-v2"];

export default function Sidebar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Hide on public/auth-flow pages: landing, login, register.
  const hidden = HIDE_ON.includes(pathname);

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await listOrgs();
        if (cancelled) return;
        setOrgs(data);
        const stored = currentOrgId();
        const match = stored && data.find((o) => o.id === stored);
        const id = match ? match.id : (data[0]?.id ?? null);
        if (id) {
          setActiveId(id);
          if (!stored && id) setCurrentOrgId(id);
        }
      } catch {
        if (!cancelled) setOrgs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hidden, pathname]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (hidden) return null;

  const active = orgs?.find((o) => o.id === activeId) ?? null;
  const isAdmin = active?.role === "admin";

  function switchOrg(id: string) {
    setCurrentOrgId(id);
    setActiveId(id);
    setOpen(false);
    router.refresh();
    router.push("/runs");
  }

  const NAV: NavItem[] = [
    {
      label: "Kontrol Paneli",
      href: "/runs",
      icon: "dashboard",
      matches: (p) => p === "/runs" || p.startsWith("/dashboard"),
    },
    {
      label: "Çalıştırmalar",
      href: "/runs",
      icon: "runs",
      matches: (p) => p === "/runs" || p.startsWith("/dashboard"),
    },
    {
      label: "Yükle",
      href: "/upload",
      icon: "upload",
      matches: (p) => p.startsWith("/upload"),
    },
    {
      label: "Üyeler",
      href: active ? `/orgs/${active.slug}/members` : "/orgs",
      icon: "members",
      adminOnly: true,
      matches: (p) => p.startsWith("/orgs/") && p.endsWith("/members"),
    },
    {
      label: "Organizasyonlar",
      href: "/orgs",
      icon: "orgs",
      matches: (p) => p === "/orgs",
    },
    {
      label: "Ayarlar",
      href: "#",
      icon: "settings",
      disabled: true,
    },
    {
      label: "Yardım",
      href: "#",
      icon: "help",
      disabled: true,
    },
  ];

  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-[240px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Brand */}
      <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-5">
        <Link
          href="/runs"
          className="group inline-flex items-baseline gap-1.5 font-mono text-[15px] font-semibold tracking-tight text-slate-900"
        >
          <span>MRLD</span>
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-emerald-700 transition-transform group-hover:scale-125"
          />
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
          Pazaryeri Denetim
        </span>
      </div>

      {/* Org switcher */}
      <div
        ref={dropdownRef}
        className="relative border-b border-slate-200 px-3 py-3"
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={!orgs || orgs.length === 0}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[12.5px] font-medium text-slate-900">
              {active ? active.name : "Organizasyon seç"}
            </span>
            {active && (
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                {ROLE_LABEL[active.role]}
              </span>
            )}
          </span>
          <span aria-hidden className="text-[10px] text-slate-400">
            ▾
          </span>
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute left-3 right-3 top-[calc(100%-4px)] z-40 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)]"
          >
            <ul className="max-h-72 overflow-y-auto py-1">
              {(orgs ?? []).map((o) => {
                const isActive = o.id === activeId;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => switchOrg(o.id)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
                        isActive
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[12.5px] font-medium">
                          {o.name}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                          {ROLE_LABEL[o.role]}
                        </span>
                      </span>
                      {isActive && (
                        <span
                          aria-hidden
                          className="text-[11px] text-emerald-600"
                        >
                          ●
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/orgs"
              onClick={() => setOpen(false)}
              className="block border-t border-slate-200 px-3 py-2 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              + Yeni…
            </Link>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-5">
        {NAV.filter((item) => !item.adminOnly || isAdmin).map((item, idx) => {
          const isActive = item.matches
            ? item.matches(pathname)
            : pathname === item.href;
          return (
            <SidebarLink
              key={`${item.href}-${idx}`}
              item={item}
              active={isActive}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-5 py-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
          v0.1
        </span>
      </div>
    </aside>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const baseClasses =
    "group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/40";

  if (item.disabled) {
    return (
      <span
        aria-disabled
        className={`${baseClasses} cursor-not-allowed text-slate-400`}
        title="Yakında"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center text-slate-400">
          <NavIcon name={item.icon} />
        </span>
        <span>{item.label}</span>
      </span>
    );
  }

  if (active) {
    return (
      <Link
        href={item.href}
        aria-current="page"
        className={`${baseClasses} border-l-2 border-emerald-600 bg-emerald-50 text-emerald-800`}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center text-emerald-700">
          <NavIcon name={item.icon} />
        </span>
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${baseClasses} text-slate-700 hover:bg-slate-50 hover:text-slate-900`}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center text-slate-500 group-hover:text-slate-700">
        <NavIcon name={item.icon} />
      </span>
      <span>{item.label}</span>
    </Link>
  );
}
