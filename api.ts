import type { Computation } from "./deps.ts";

export interface Effect<THandle = unknown, TResult = unknown> {
  handle: THandle;
  attributes: Attributes;
  children: Set<Effect>;
  use<H, R>(activation: UseEffect<H,R>, options?: UseOptions<R>): Computation<Effect<H,R>>;
  destroy(): Computation<void>;
  conclusion(): Computation<TResult>;
}

export interface Context {
  use<H, R>(activate: UseEffect<H,R>, options?: UseOptions<R>): Computation<Effect<H,R>>;
}

export type CreateEffect<THandle, TResult> = Computation<Effect<THandle,TResult>>;

export interface UseEffect<THandle, TResult> {
  (context: Context): CreateEffect<THandle, TResult>;
}

export interface UseOptions<TResult> {
  trap?(conclusion: Computation<TResult>): Computation<void>;
}

export interface Attributes extends Record<string, string | number | boolean> {
  name: string;
  type: string;
}
