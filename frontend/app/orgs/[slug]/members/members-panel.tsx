"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  inviteMember,
  removeMember,
  updateMemberRole,
  type Member,
  type Role,
} from "@/lib/api";
import { getCurrentUser, type User } from "@/lib/auth";

type OrgInfo = { id: string; name: string; slug: string; role: Role };

const dateFmt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateFmt.format(d);
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Yönetici" },
  { value: "member", label: "Üye" },
  { value: "viewer", label: "Görüntüleyici" },
];

const roleLabel: Record<Role, string> = {
  admin: "Yönetici",
  member: "Üye",
  viewer: "Görüntüleyici",
};

const roleBadgeClass: Record<Role, string> = {
  admin: "border-emerald-200 bg-emerald-50 text-emerald-700",
  member: "border-slate-200 bg-slate-100 text-slate-700",
  viewer: "border-slate-200 bg-slate-50 text-slate-500",
};

export default function MembersPanel({
  org,
  initialMembers,
  initialError,
}: {
  org: OrgInfo;
  initialMembers: Member[];
  initialError: string | null;
}) {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [error, setError] = useState<string | null>(initialError);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getCurrentUser();
      if (!cancelled) setMe(u);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = org.role === "admin";

  const adminCount = useMemo(
    () => members.filter((m) => m.role === "admin").length,
    [members],
  );

  async function handleRoleChange(userId: string, role: Role) {
    setError(null);
    setBusyUserId(userId);
    try {
      await updateMemberRole(org.id, userId, role);
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rol güncellenemedi.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemove(userId: string) {
    setError(null);
    setBusyUserId(userId);
    try {
      await removeMember(org.id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Üye çıkarılamadı.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleInvite(email: string, role: Role): Promise<string | null> {
    setError(null);
    const result = await inviteMember(org.id, email, role);
    if (result.ok) {
      router.refresh();
      return null;
    }
    if (result.reason === "not_found") return "Bu email kayıtlı değil.";
    if (result.reason === "forbidden")
      return "Bu işlem için yetkin yok.";
    return result.message || "Davet gönderilemedi.";
  }

  return (
    <div className="px-8 py-6">
      <div className="flex flex-col gap-6">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
              {org.slug}
            </span>
            <h2 className="text-[28px] font-medium tracking-[-0.02em] text-slate-900">
              {org.name} · Üyeler
            </h2>
            <p className="text-[13.5px] leading-relaxed text-slate-600">
              Organizasyondaki kişileri ve rollerini yönet.
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${roleBadgeClass[org.role]}`}
          >
            {roleLabel[org.role]}
          </span>
        </header>

        {error && (
          <div
            role="alert"
            className="relative rounded-md border border-red-200 bg-red-50 px-4 py-3 pl-5 text-[13px] text-red-700"
          >
            <span
              aria-hidden
              className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-red-500"
            />
            {error}
          </div>
        )}

        {isAdmin && <InviteForm onInvite={handleInvite} />}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Email</Th>
                <Th>Ad</Th>
                <Th>Rol</Th>
                <Th>Eklenme</Th>
                {isAdmin && <Th align="right">İşlemler</Th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isMe = me?.id === m.userId;
                const isLastAdmin =
                  m.role === "admin" && adminCount <= 1 && isMe;
                const busy = busyUserId === m.userId;
                return (
                  <tr
                    key={m.userId}
                    className="border-b border-slate-200 transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3.5 text-slate-700">
                      <span
                        className="block max-w-[32ch] truncate"
                        title={m.email}
                      >
                        {m.email}
                      </span>
                      {isMe && (
                        <span className="ml-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-emerald-700">
                          (sen)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {m.name ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {isAdmin && !isLastAdmin ? (
                        <select
                          value={m.role}
                          disabled={busy}
                          onChange={(e) =>
                            handleRoleChange(
                              m.userId,
                              e.target.value as Role,
                            )
                          }
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.10em] ${roleBadgeClass[m.role]}`}
                          title={
                            isLastAdmin
                              ? "tek yöneticisin"
                              : undefined
                          }
                        >
                          {roleLabel[m.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-500">
                      {formatDate(m.createdAt)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(m.userId)}
                          disabled={busy || isLastAdmin}
                          title={
                            isLastAdmin ? "tek yöneticisin" : undefined
                          }
                          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700"
                        >
                          Çıkar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {members.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-4 py-10 text-center text-[13px] text-slate-500"
                  >
                    Henüz üye yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InviteForm({
  onInvite,
}: {
  onInvite: (email: string, role: Role) => Promise<string | null>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email zorunlu.");
      return;
    }
    setSubmitting(true);
    const err = await onInvite(trimmed, role);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(`${trimmed} davet edildi.`);
      setEmail("");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.20em] text-slate-500">
          Üye Davet Et
        </span>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-2">
          <label
            htmlFor="invite-email"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500"
          >
            Email
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@firma.com"
            className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <div className="flex flex-col gap-2 sm:w-[180px]">
          <label
            htmlFor="invite-role"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500"
          >
            Rol
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:self-end"
        >
          {submitting ? "Gönderiliyor…" : "Davet Et"}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-700"
        >
          {success}
        </div>
      )}
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
      className={`px-4 py-3 ${alignClass} text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500`}
    >
      {children}
    </th>
  );
}
