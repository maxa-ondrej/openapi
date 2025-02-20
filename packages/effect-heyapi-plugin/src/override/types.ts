import type { Plugin } from '@hey-api/openapi-ts';
import type { Config } from '../types.js';

type IrHandler = Parameters<Plugin.Handler<Config>>[0];
// biome-ignore lint/style/useNamingConvention: <explanation>
export type IRPlugin = IrHandler['plugin'];
// biome-ignore lint/style/useNamingConvention: <explanation>
export type IRContext = IrHandler['context'];

// biome-ignore lint/style/useNamingConvention: <explanation>
export type TSFile = ReturnType<IRContext['createFile']>;

// biome-ignore lint/style/useNamingConvention: <explanation>
export type IR = IRContext['ir'];

// biome-ignore lint/style/useNamingConvention: <explanation>
export type IRSchemaObject = NonNullable<
  NonNullable<IR['components']>['schemas']
>[string];

// biome-ignore lint/style/useNamingConvention: <explanation>
export type IRPathItemObject = NonNullable<IR['paths']>[`/${string}`];

// biome-ignore lint/style/useNamingConvention: <explanation>
export type IROperationObject = NonNullable<IRPathItemObject['get']>;

// biome-ignore lint/style/useNamingConvention: <explanation>
export type IRResponseObject = NonNullable<
  NonNullable<IROperationObject['responses']>[string]
>;
