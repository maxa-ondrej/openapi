import type { Plugin } from '@hey-api/openapi-ts';
import type { Config } from '../types.js';

type IrHandler = Parameters<Plugin.Handler<Config>>[0];
export type IRPlugin = IrHandler['plugin'];
export type IRContext = IrHandler['context'];

export type TSFile = ReturnType<IRContext['createFile']>;

export type IR = IRContext['ir'];

export type IRSchemaObject = NonNullable<
  NonNullable<IR['components']>['schemas']
>[string];

export type IRPathItemObject = NonNullable<IR['paths']>[`/${string}`];

export type IROperationObject = NonNullable<IRPathItemObject['get']>;

export type IRResponseObject = NonNullable<
  NonNullable<IROperationObject['responses']>[string]
>;
