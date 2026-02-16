export type Result<T> =
  | {
      ok: true;
      value: T;
      error: undefined;
    }
  | {
      ok: false;
      value: undefined;
      error: string;
    };
