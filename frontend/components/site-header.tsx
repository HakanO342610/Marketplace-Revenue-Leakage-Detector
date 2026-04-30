"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getCurrentUser, type User } from "@/lib/auth";
import {
  currentOrgId,
  listOrgs,
  type Organization,
  type Role,
} from "@/lib/api";

type AuthState =
  | { status: "loading" }
  | { status: "authed"; user: User }
  | { status: "anon" };

const ROLE_LABEL: Record<Role, string> = {
  admin: "Yönetici",
  member: "Üye",
  viewer: "Görüntüleyici",
};

// Auth-flow / public surfaces use a marketing-style header (no top bar chrome).
const PUBLIC_PATHS: readonly string[] = ["/", "/login", "/register", "/landing-v2"];

// Map known top-level paths to a Turkish page title for the top bar.
function pageTitleFor(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "Mutabakat Çalıştırması";
  if (pathname.startsWith("/runs")) return "Kontrol Paneli";
  if (pathname.startsWith("/upload")) return "Yeni Yükleme";
  if (pathname.startsWith("/orgs")) return "Organizasyonlar";
  return "MRLD";
}

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (cancelled) return;
      setAuth(user ? { status: "authed", user } : { status: "anon" });
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (auth.status !== "authed") return;
    let cancelled = false;
    (async () => {
      try {
        const orgs = await listOrgs();
        if (cancelled) return;
        const stored = currentOrgId();
        const match = stored ? orgs.find((o) => o.id === stored) : null;
        setActiveOrg(match ?? orgs[0] ?? null);
      } catch {
        if (!cancelled) setActiveOrg(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.status, pathname]);

  function handleLogout() {
    clearToken();
    setAuth({ status: "anon" });
    setActiveOrg(null);
    router.push("/");
    router.refresh();
  }

  // Standalone marketing previews: template ships its own nav.
  if (pathname === "/landing-v2") return null;

  if (PUBLIC_PATHS.includes(pathname)) {
    return <PublicHeader auth={auth} onLogout={handleLogout} />;
  }

  return (
    <AppTopBar
      pathname={pathname}
      auth={auth}
      activeOrg={activeOrg}
      onLogout={handleLogout}
    />
  );
}

/* --------------------------------- App top bar -------------------------------- */

function AppTopBar({
  pathname,
  auth,
  activeOrg,
  onLogout,
}: {
  pathname: string;
  auth: AuthState;
  activeOrg: Organization | null;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b0d12]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[#0b0d12]/60">
      <div className="flex items-center justify-between gap-4 px-8 py-3.5">
        <h1 className="text-[18px] font-medium tracking-[-0.01em] text-zinc-100">
          {pageTitleFor(pathname)}
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[12px] font-medium text-zinc-200 transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-50"
            aria-label="Dil seçici"
          >
            <span aria-hidden className="text-[11px] text-zinc-400">
              ◐
            </span>
            <span>TR</span>
          </button>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.02] text-[13px] text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-100"
            aria-label="Tema değiştir"
          >
            <span aria-hidden>☾</span>
          </button>

          {auth.status === "loading" && (
            <span
              aria-hidden
              className="ml-2 inline-block h-7 w-40 animate-pulse rounded-md bg-white/5"
            />
          )}

          {auth.status === "authed" && (
            <>
              {activeOrg && (
                <Link
                  href="/orgs"
                  className="ml-1 hidden flex-col items-end leading-none sm:flex"
                  title="Organizasyonu değiştir"
                >
                  <span className="text-[13px] text-zinc-200 hover:text-zinc-50">
                    {activeOrg.name}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                    {ROLE_LABEL[activeOrg.role]}
                  </span>
                </Link>
              )}
              <UserPill user={auth.user} onLogout={onLogout} />
            </>
          )}

          {auth.status === "anon" && (
            <div className="ml-1 flex items-center gap-1.5">
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-[12px] font-medium text-zinc-300 transition-colors hover:text-zinc-100"
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-violet-500 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-400"
              >
                Kayıt
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function UserPill({ user, onLogout }: { user: User; onLogout: () => void }) {
  const initial = (user.email[0] ?? "?").toUpperCase();
  return (
    <div className="ml-1 flex items-center gap-2">
      <div className="hidden items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] py-1 pl-1 pr-3 sm:flex">
        <span
          aria-hidden
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-[11px] font-semibold text-violet-200"
        >
          {initial}
        </span>
        <span className="flex items-baseline gap-2 leading-none">
          <span className="text-[12px] text-zinc-200" title={user.email}>
            {user.email}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11.5px] font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-100"
      >
        Çıkış
      </button>
    </div>
  );
}

/* --------------------------------- Public header ------------------------------ */

function PublicHeader({
  auth,
  onLogout,
}: {
  auth: AuthState;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b0d12]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[#0b0d12]/60">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3.5">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-1.5 font-mono text-sm font-semibold tracking-tight text-zinc-100"
        >
          <span>MRLD</span>
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.6)] transition-transform group-hover:scale-125"
          />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {auth.status === "loading" && (
            <span
              aria-hidden
              className="ml-3 inline-block h-4 w-24 animate-pulse rounded bg-white/5"
            />
          )}

          {auth.status === "authed" && (
            <>
              <Link
                href="/runs"
                className="rounded-md px-3 py-1.5 text-[12px] font-medium text-zinc-300 transition-colors hover:text-zinc-100"
              >
                Kontrol Paneli
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="ml-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11.5px] font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-100"
              >
                Çıkış
              </button>
            </>
          )}

          {auth.status === "anon" && (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-[12px] font-medium text-zinc-300 transition-colors hover:text-zinc-100"
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="ml-1 rounded-md bg-violet-500 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-400"
              >
                Kayıt
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
