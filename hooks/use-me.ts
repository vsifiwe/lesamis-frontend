"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface MeProfile {
  full_name: string
  role: string
}

export function useMe() {
  const [data, setData] = useState<MeProfile | null>(null)

  useEffect(() => {
    api.get<MeProfile>("/api/v1/me/")
      .then(setData)
      .catch(() => {})
  }, [])

  return data
}
