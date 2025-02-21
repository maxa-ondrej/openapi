import { Headers } from '@effect/platform';
import { Context, Duration, Layer, Option, Ref } from 'effect';

export type ApiConfig = {
  baseUrl: string;
  staleTime: Option.Option<Duration.Duration>;
  headers: Headers.Headers;
};

export type ApiConfigInput = {
  baseUrl: string;
  staleTime?: Duration.DurationInput;
  headers?: Headers.Input;
};

export class Config extends Context.Tag('ApiClientConfig')<
  Config,
  Ref.Ref<ApiConfig>
>() {}

export const layer = ({
  baseUrl,
  headers = Headers.empty,
  staleTime,
}: ApiConfigInput) =>
  Layer.effect(
    Config,
    Ref.make({
      baseUrl,
      headers: Headers.fromInput(headers),
      staleTime: Option.fromNullable(staleTime).pipe(
        Option.map(Duration.decode),
      ),
    }),
  );
