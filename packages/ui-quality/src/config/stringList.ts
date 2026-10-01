import { expectConfig } from '@/config/expectConfig.js'

export const stringList = (value: unknown, where: string): string[] => {
  const list = value ?? []
  expectConfig(
    Array.isArray(list) && list.every((item) => typeof item === 'string'),
    `${where} must be a list of strings`,
  )
  return list
}
