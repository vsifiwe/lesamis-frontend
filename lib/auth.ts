const ACCESS_TOKEN_KEY = "la_access"
const REFRESH_TOKEN_KEY = "la_refresh"

export interface TokenPayload {
  user_id: string
  is_admin: boolean
  exp: number
  iat: number
}

export function decodeToken(token: string): TokenPayload {
  const payload = token.split(".")[1]
  return JSON.parse(atob(payload)) as TokenPayload
}

export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = decodeToken(token)
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): TokenPayload | null {
  const token = getAccessToken()
  if (!token) return null
  if (isTokenExpired(token)) {
    clearTokens()
    return null
  }
  try {
    return decodeToken(token)
  } catch {
    clearTokens()
    return null
  }
}
