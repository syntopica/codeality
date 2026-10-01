import type { AuthConfig } from '@/config/AuthConfig.js'
import { expectConfig } from '@/config/expectConfig.js'
import { isRecord } from '@/config/isRecord.js'
import { stringField } from '@/config/stringField.js'

export const authFrom = (value: unknown): AuthConfig | null => {
  if (value === undefined || value === null) return null
  expectConfig(isRecord(value), 'auth must be an object')
  return {
    loginPath: stringField(value, 'loginPath', '/login', 'auth'),
    usernameEnv: stringField(value, 'usernameEnv', 'UI_QUALITY_USER', 'auth'),
    passwordEnv: stringField(
      value,
      'passwordEnv',
      'UI_QUALITY_PASSWORD',
      'auth',
    ),
    usernameSelector: stringField(
      value,
      'usernameSelector',
      'input[type=email], input[name=email], input[name=username], input[type=text]',
      'auth',
    ),
    passwordSelector: stringField(
      value,
      'passwordSelector',
      'input[type=password]',
      'auth',
    ),
    submitSelector: stringField(
      value,
      'submitSelector',
      'button[type=submit]',
      'auth',
    ),
  }
}
