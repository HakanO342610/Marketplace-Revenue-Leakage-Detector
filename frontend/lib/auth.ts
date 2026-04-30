"use client";

import {
  clearCurrentOrgId,
  setCurrentOrgId,
  type OrganizationLite,
} from "@/lib/api";

export type User = {
  id: string;
  email: string;
  name?: string | null;
};

const TOKEN_KEY = "mrld_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, t);
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(
    t,
  )}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
  clearCurrentOrgId();
}

type AuthSuccess = {
  token: string;
  user: User;
  orgs: OrganizationLite[];
};

type AuthApiResponse = {
  user: User;
  access_token: string;
  orgs?: OrganizationLite[];
};

async function postAuth(
  path: string,
  body: Record<string, unknown>,
): Promise<AuthSuccess> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `İstek başarısız (${res.status}).`;
    try {
      const data: unknown = await res.json();
      if (
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
      ) {
        message = (data as { message: string }).message;
      }
    } catch {
      // ignore json parse errors
    }
    if (res.status === 401) {
      message = "Geçersiz e-posta veya şifre.";
    }
    throw new Error(message);
  }
  const data = (await res.json()) as AuthApiResponse;
  setToken(data.access_token);
  const orgs = Array.isArray(data.orgs) ? data.orgs : [];
  if (orgs.length > 0) {
    setCurrentOrgId(orgs[0].id);
  }
  return { token: data.access_token, user: data.user, orgs };
}

export async function login(
  email: string,
  password: string,
): Promise<AuthSuccess> {
  return postAuth("/api/auth/login", { email, password });
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthSuccess> {
  const body: Record<string, unknown> = { email, password };
  if (name && name.trim().length > 0) body.name = name.trim();
  return postAuth("/api/auth/register", body);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) {
    clearToken();
    return null;
  }
  if (!res.ok) return null;
  return (await res.json()) as User;
}
