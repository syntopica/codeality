import { greetingSchema } from '@/services/greetingSchema'
import type { Greeting } from '@/types/Greeting'

export async function fetchGreeting(url: string): Promise<Greeting> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Greeting request failed: ${String(response.status)}`)
  }
  const payload: unknown = await response.json()
  return greetingSchema.parse(payload)
}
