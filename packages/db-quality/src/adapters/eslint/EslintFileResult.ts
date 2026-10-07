export type EslintFileResult = {
  filePath: string
  messages: { ruleId: string | null; message: string; line: number }[]
}
