import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./auth"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  constructor(public status: number, public data: unknown) {
    super(`API error ${status}`)
  }
}

async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<unknown> {
  const token = getAccessToken()

  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init.headers as Record<string, string>),
  }

  if (token) {
    headers["authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })

  if (res.ok) {
    // 204 No Content — nothing to parse
    if (res.status === 204) return undefined
    return res.json()
  }

  // Attempt token refresh on 401
  if (res.status === 401 && retry) {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/token/refresh/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (refreshRes.ok) {
        const { access, refresh } = await refreshRes.json()
        saveTokens(access, refresh)
        return apiFetch(path, init, false)
      }
    }

    clearTokens()
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = null
  }

  throw new ApiError(res.status, data)
}

export const api = {
  get<T>(path: string, init?: RequestInit): Promise<T> {
    return apiFetch(path, { ...init, method: "GET" }) as Promise<T>
  },

  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return apiFetch(path, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }) as Promise<T>
  },

  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return apiFetch(path, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }) as Promise<T>
  },

  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return apiFetch(path, {
      ...init,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }) as Promise<T>
  },

  delete<T>(path: string, init?: RequestInit): Promise<T> {
    return apiFetch(path, { ...init, method: "DELETE" }) as Promise<T>
  },
}
