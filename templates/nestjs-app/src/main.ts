import type { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app/app.module'

export const bootstrap = async (): Promise<void> => {
  const app: INestApplication<unknown> = await NestFactory.create(AppModule)
  await app.listen(process.env['PORT'] ?? 3000)
}

void bootstrap()
