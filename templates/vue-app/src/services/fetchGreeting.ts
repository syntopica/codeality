import { z } from 'zod'

import type { Greeting } from '@/types/Greeting'

export const fetchGreeting = async (url: string): Promise<Greeting> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Greeting request failed: ${response.status}`)
  }
  const payload: unknown = await response.json()
  return z.object({ message: z.string().min(1) }).parse(payload)
}
