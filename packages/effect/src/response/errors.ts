import { Effect, Schema } from 'effect';

export class ApiError<E extends Record<string, Schema.Schema.AnyNoContext>> {
  readonly _tag = 'ApiError';

  constructor(
    readonly schemas: E,
    readonly error: unknown,
    readonly status: string,
  ) {}
}

export type ExtractError<
  E extends Record<string, Schema.Schema.AnyNoContext>,
  Status extends string,
> = Status extends keyof E
  ? E[Status]['Type']
  : ExtractErrorStatusGroup<E, Status>;

type ErrorGroup<Status extends string> =
  Status extends `${infer StatusPrefix}${string}` ? `${StatusPrefix}xx` : never;

type ExtractErrorStatusGroup<
  E extends Record<string, Schema.Schema.AnyNoContext>,
  Status extends string,
> = ErrorGroup<Status> extends keyof E
  ? E[ErrorGroup<Status>]['Type']
  : 'default' extends keyof E
    ? E['default']['Type']
    : unknown;

export const handleStatus =
  <
    E extends Record<string, Schema.Schema.AnyNoContext>,
    Status extends string,
    RetT,
    RetE,
    RetC,
  >(
    status: Status,
    fn: (error: ExtractError<E, Status>) => Effect.Effect<RetT, RetE, RetC>,
  ) =>
  (error: ApiError<E>) =>
    Effect.if(error.status === status, {
      onFalse: () => Effect.fail(error),
      onTrue: () => {
        const schema =
          error.schemas[status] ??
          error.schemas[`${status[0]}xx`] ??
          error.schemas.default ??
          null;
        return Effect.andThen(
          schema === null
            ? Effect.succeed(error.error)
            : Schema.decodeUnknown(schema)(error.error),
          (error: ExtractError<E, Status>) => fn(error),
        );
      },
    });
