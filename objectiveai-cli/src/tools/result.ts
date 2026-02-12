export type Result<T> =
  | {
      ok: false;
      value: undefined;
      error: string;
    }
  | {
      ok: true;
      value: T;
      error: undefined;
    };
