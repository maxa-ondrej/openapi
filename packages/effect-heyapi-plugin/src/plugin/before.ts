import { Array, Effect, Option, Record, String, Tuple, pipe } from 'effect';
import ts from 'typescript';
import { ApiDevContext, type OnBefore } from '../adapter/index.js';
import { Function, Module, Struct } from '../compiler/index.js';
import { defaultConfig } from '../config.js';
import type { TSFile } from '../override/types.js';

type Import = Parameters<TSFile['import']>[0];
type ImportDefinition = Omit<Import, 'module'>;

export const before: OnBefore = () =>
  ApiDevContext.ApiDevContext.pipe(
    Effect.bind('layer', () => createAppLayer()),
    Effect.tap(() => Effect.logDebug('Finished creating app layer')),
    Effect.bind('imports', ({ file }) =>
      pipe(
        createImports(),
        Array.map((importDefinition) =>
          Effect.try(() => file.import(importDefinition)),
        ),
        Effect.all,
      ),
    ),
    Effect.tap(() => Effect.logDebug('Finished adding imports')),
    Effect.tap(({ file, layer }) => Effect.try(() => file.add(layer))),
    Effect.tap(() => Effect.logDebug('Finished writing app layer')),
    Effect.tap(() => Effect.logInfo('Starting plugin')),
  );

const createAppLayer = () =>
  ApiDevContext.ApiDevContext.pipe(
    Effect.let('baseUrl', ({ plugin }) =>
      pipe(
        plugin.baseUrl ?? defaultConfig.baseUrl,
        String.replaceAll(/'/g, "\\'"),
        ts.factory.createStringLiteral,
        (value) => Tuple.make('baseUrl', value),
      ),
    ),
    Effect.let('staleTime', ({ plugin }) =>
      pipe(
        plugin.staleTime,
        Option.fromNullable,
        Option.map(ts.factory.createStringLiteral),
        Option.getOrElse(() => ts.factory.createVoidZero()),
        (value) => Tuple.make('staleTime', value),
      ),
    ),
    Effect.bind('apiConfig', ({ baseUrl, staleTime }) =>
      Struct.createObject([baseUrl, staleTime]),
    ),
    Effect.let('layers', ({ apiConfig }) =>
      Array.make(
        Function.createMethodCall(
          ts.factory.createIdentifier('ApiConfig'),
          'layer',
        )([apiConfig]),
        Struct.createPropertyAccess(
          ts.factory.createIdentifier('Wrapper'),
          'WrapperLive',
        ),
        Struct.createPropertyAccess(
          ts.factory.createIdentifier('FetchHttpClient'),
          'layer',
        ),
      ),
    ),
    Effect.andThen(({ layers }) => Effect.all(layers)),
    Effect.andThen(
      Function.createMethodCall(
        ts.factory.createIdentifier('Layer'),
        'mergeAll',
      ),
    ),
    Effect.andThen(Module.createConstExport('ClientLayer')),
  );

const createImports = () =>
  pipe(
    Record.empty<string, Array.NonEmptyReadonlyArray<ImportDefinition>>(),
    Record.set('effect', Array.make('Effect', 'Schema', 'Layer', 'Option')),
    Record.set('@effect/platform', Array.make('FetchHttpClient')),
    Record.set(
      '@majksa-openapi/effect',
      Array.make('Wrapper', 'ApiConfig', 'Request', 'Response'),
    ),
    mapImports,
  );

const mapImports = (
  imports: Record<
    string,
    Array.NonEmptyReadonlyArray<string | ImportDefinition>
  >,
): Import[] =>
  pipe(
    imports,
    Record.toEntries,
    Array.map(([module, modules]) =>
      Array.map(modules, (definition) =>
        typeof definition === 'string'
          ? ({ module, name: definition } satisfies Import)
          : ({ ...definition, module } satisfies Import),
      ),
    ),
    Array.flatten,
  );
