type ApiResult<T> = { ok: boolean; data?: T; message?: string };

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; ok?: boolean };
  if (!res.ok) {
    return { ok: false, message: data.message ?? "Request failed." };
  }
  return { ok: true, data };
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = (await res.json().catch(() => ({}))) as {
    user?: { email: string };
    access_token?: string;
    refresh_token?: string;
    message?: string;
  };
  if (!res.ok) {
    return { ok: false, message: data.message ?? "Login failed." };
  }
  return { ok: true, data };
}

export async function requestReset(email: string) {
  return postJson<{ ok: boolean; code?: string }>("/api/auth/forgot", { email });
}

export async function verifyCode(email: string, code: string) {
  return postJson<{ ok: boolean }>("/api/auth/verify", { email, code });
}

export async function resetPassword(email: string, password: string) {
  return postJson<{ ok: boolean }>("/api/auth/reset", { email, password });
}
