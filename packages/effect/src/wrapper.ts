import {
  type Error,
  Headers,
  type HttpBody,
  HttpClient,
  type HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
  type HttpMethod,
  KeyValueStore,
} from '@effect/platform';
import {
  Context,
  DateTime,
  Duration,
  Effect,
  Layer,
  Option,
  type ParseResult,
  type Record,
  Ref,
  Schema,
  Stream,
  pipe,
} from 'effect';
import { Config } from './config.js';
import { ApiConfig } from './index.js';
import { ApiError } from './response/errors.js';
import { parseStream, parseSync } from './response/index.js';
import { RecordFrom } from './schema.js';

type BaseData<P, Q, B> = {
  method: HttpMethod.HttpMethod;
  url: string;
} & (P extends void ? { path: P } : object) &
  (Q extends void ? { query: Q } : object) &
  (B extends void ? { body: B } : object);

type Data<P, Q, B> = {
  readonly headers?: Headers.Input;
} & (P extends void ? object : { readonly path: P }) &
  (Q extends void ? object : { readonly query: Q }) &
  (B extends void ? object : { readonly body: B });

type Schemas<
  Path,
  Query,
  Body,
  P,
  Q,
  Response,
  R,
  E extends Record<string, Schema.Schema.AnyNoContext>,
> = {
  pathParamsEncoder: Schema.Schema<Path, P>;
  queryParamsEncoder: Schema.Schema<Query, Q>;
  bodyEncoder: Schema.Schema<Body, HttpBody.HttpBody>;
  responseDecoder: Schema.Schema<Response, R>;
  errorsDecoder: E;
};

export class Wrapper extends Context.Tag('ApiClientEffectWrapper')<
  Wrapper,
  {
    fetch: <
      Path,
      Query,
      Body,
      P,
      Q,
      Response,
      R,
      E extends Record<string, Schema.Schema.AnyNoContext>,
    >(
      schemas: Schemas<Path, Query, Body, P, Q, Response, R, E>,
    ) => (
      data: BaseData<Path, Query, Body>,
    ) => (
      data: Data<Path, Query, Body> & { staleTime?: Duration.DurationInput },
    ) => Effect.Effect<
      Response,
      | HttpBody.HttpBodyError
      | HttpClientError.HttpClientError
      | ParseResult.ParseError
      | ApiError<E>
      | Error.PlatformError,
      HttpClient.HttpClient | Config | KeyValueStore.KeyValueStore
    >;
    subscribe: <
      Path,
      Query,
      Body,
      P,
      Q,
      Response,
      R,
      E extends Record<string, Schema.Schema.AnyNoContext>,
    >(
      schemas: Schemas<Path, Query, Body, P, Q, Response, R, E>,
    ) => (
      base: BaseData<Path, Query, Body>,
    ) => (
      data: Data<Path, Query, Body>,
    ) => Effect.Effect<
      Stream.Stream<
        Response,
        HttpClientError.ResponseError | ParseResult.ParseError
      >,
      | HttpBody.HttpBodyError
      | HttpClientError.HttpClientError
      | ParseResult.ParseError
      | ApiError<E>,
      HttpClient.HttpClient | Config
    >;
  }
>() {}

export const extractCallable =
  () =>
  <I, T, E1, E2, R1, R2>(
    effect: Effect.Effect<(arg: I) => Effect.Effect<T, E1, R1>, E2, R2>,
  ) =>
  (data: I): Effect.Effect<T, E1 | E2, R1 | R2> =>
    effect.pipe(Effect.andThen((fetch) => fetch(data)));

export const extractCallableAndProvide =
  <R>(layers: Layer.Layer<R>) =>
  <I, T, E1, E2, R1 extends R, R2 extends R>(
    effect: Effect.Effect<(arg: I) => Effect.Effect<T, E1, R1>, E2, R2>,
  ) =>
  (data: I): Effect.Effect<T, E1 | E2> =>
    effect.pipe(
      Effect.andThen((fetch) => fetch(data)),
      Effect.provide(layers),
    );

export const createPathFromTemplate = (
  template: string,
  params: Record.ReadonlyRecord<string, string>,
) =>
  pipe(template, (template) =>
    template.replaceAll(/\{([^}]+)\}/g, (_, key) =>
      key in params ? params[key] : `{${key}}`,
    ),
  );

const executeRequest =
  <
    Path,
    Query,
    Body,
    P,
    Q,
    Response,
    R,
    E extends Record<string, Schema.Schema.AnyNoContext>,
  >({
    bodyEncoder,
    pathParamsEncoder,
    queryParamsEncoder,
    errorsDecoder,
  }: Schemas<Path, Query, Body, P, Q, Response, R, E>) =>
  (base: BaseData<Path, Query, Body>) =>
  (data: Data<Path, Query, Body>) =>
    HttpClient.HttpClient.pipe(
      Effect.tap(() => Effect.logDebug('🚀 Executing Request')),
      Effect.bindTo('client'),
      Effect.bind('config', () => Config.pipe(Effect.andThen(Ref.get))),
      Effect.tap(({ config }) => Effect.logDebug('⚙️ Api Config', config)),
      Effect.bind('path', () =>
        pipe(
          Option.fromNullable('path' in data ? data.path : null),
          Option.getOrNull,
          (path) => path as Schema.Schema.Type<typeof pathParamsEncoder>,
          Schema.encode(RecordFrom(pathParamsEncoder)),
        ),
      ),
      Effect.bind('query', () =>
        pipe(
          Option.fromNullable('query' in data ? data.query : null),
          Option.getOrNull,
          (query) => query as Schema.Schema.Type<typeof queryParamsEncoder>,
          Schema.encode(RecordFrom(queryParamsEncoder)),
        ),
      ),
      Effect.bind('body', () =>
        pipe(
          Option.fromNullable('body' in data ? data.body : null),
          Option.getOrNull,
          (body) => body as Schema.Schema.Type<typeof bodyEncoder>,
          Schema.encode(bodyEncoder),
        ),
      ),
      Effect.let('url', ({ config, path }) =>
        createPathFromTemplate(config.baseUrl + base.url, path),
      ),
      Effect.let('request', ({ url, query, body, config }) =>
        HttpClientRequest.make(base.method)(url).pipe(
          HttpClientRequest.setBody(body),
          HttpClientRequest.appendUrlParams(query),
          HttpClientRequest.setHeaders(
            Headers.merge(config.headers, Headers.fromInput(data.headers)),
          ),
        ),
      ),
      Effect.let('queryKey', ({ request }) => request.hash),
      Effect.andThen(({ client, request }) => client.execute(request)),
      Effect.andThen(
        HttpClientResponse.matchStatus({
          '2xx': (response) => Effect.succeed(response),
          orElse: (response) =>
            Effect.andThen(response.json, (error) =>
              Effect.fail(
                new ApiError(errorsDecoder, error, response.status.toString()),
              ),
            ),
        }),
      ),
    );

export const WrapperLive = Layer.succeed(
  Wrapper,
  Wrapper.of({
    fetch: (schemas) => (base) => (data) =>
      Effect.gen(function* () {
        const kv = yield* KeyValueStore.KeyValueStore;
        const store = kv.forSchema(
          Schema.Struct({
            date: Schema.DateTimeUtc,
            data: schemas.responseDecoder,
          }),
        );
        const config = yield* Effect.flatten(ApiConfig.Config);
        const staleTime = Option.fromNullable(data.staleTime).pipe(
          Option.map(Duration.decode),
          Option.orElse(() => config.staleTime),
        );
        Effect.logDebug('🔍 Stale Time', staleTime);
        const mergedInput = {
          ...base,
          ...data,
          staleTime: undefined,
        };
        const queryKey = JSON.stringify(mergedInput);
        Effect.logDebug('🔍 Query Key', queryKey);
        const cached = yield* store.get(queryKey);
        if (Option.isSome(cached)) {
          Effect.logDebug('🔍 Cache Hit');
          const { date, data: response } = cached.value;
          Effect.logDebug(
            '🔍 Cache Date',
            date,
            Option.isSome(staleTime) &&
              (yield* DateTime.isFuture(
                DateTime.addDuration(date, staleTime.value),
              ))
              ? '🥦 FRESH'
              : '🍅 STALE',
          );
          if (
            Option.isSome(staleTime) &&
            (yield* DateTime.isFuture(
              DateTime.addDuration(date, staleTime.value),
            ))
          ) {
            return response;
          }
        }
        const response = yield* executeRequest(schemas)(base)(data).pipe(
          Effect.andThen(parseSync),
          Effect.andThen((response) =>
            pipe(response, Schema.decodeUnknown(schemas.responseDecoder)),
          ),
          Effect.scoped,
        );
        if (Option.isSome(staleTime)) {
          yield* store.set(queryKey, {
            date: yield* DateTime.now,
            data: response,
          });
        }
        return response;
      }),
    subscribe: (schemas) => (base) => (data) =>
      executeRequest(schemas)(base)(data).pipe(
        Effect.andThen(parseStream),
        Effect.map((response) =>
          Stream.mapEffect(
            response,
            Schema.decodeUnknown(schemas.responseDecoder),
          ),
        ),
        Effect.scoped,
      ),
  }),
);
