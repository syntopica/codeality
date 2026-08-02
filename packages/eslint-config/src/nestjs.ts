import { createNodeConfig } from './node'

// NestJS service layer. Compose it like the other framework presets:
//   createBaseConfig() + createNestjsConfig() + createCodeQualityConfig()
// It builds on the node preset (Node globals + prefer-node-protocol) and only
// adds the decorator-aware rule tweaks NestJS needs on top of the strict base.
export const createNestjsConfig = () => [
  ...createNodeConfig(),
  {
    files: ['**/*.ts'],
    rules: {
      // @Module(), @Injectable() and friends are intentionally empty classes
      // whose only job is to carry a decorator; the strict base flags these as
      // extraneous, so allow classes that exist solely to be decorated.
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowWithDecorator: true },
      ],
      // NestJS DI reads constructor parameter types at runtime via
      // emitDecoratorMetadata. Forcing type-only imports would erase those
      // class references and break injection, so keep value imports here.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
]
