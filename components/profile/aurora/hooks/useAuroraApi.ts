// components/profile/aurora/hooks/useAuroraApi.ts
"use client";

export function getApiBase() {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (env && env.startsWith("http")) return env;
  if (typeof window !== "undefined") return `http://${window.location.hostname}:5000`;
  return "http://localhost:5000";
}

export async function apiJson<T>(
  url: string,
  opts: {
    method?: "GET" | "POST";
    token: string;
    body?: any;
  }
): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.token}`,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`.trim());
  }
  return (await res.json()) as T;
}