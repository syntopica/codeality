import { createBaseConfig } from "./src/base.ts";
import { createNodeConfig } from "./src/node.ts";

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
];
