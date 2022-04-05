import type { Computation } from "./deps.ts";

export interface Effect<THandle = unknown, TResult = unknown> {
  handle: THandle;
  attributes: Attributes;
  children: Set<Effect>;
  activate<H, R>(activation: Activation<H,R>, options?: ActivationOptions<R>): Computation<Effect<H,R>>;
  destroy(): Computation<void>;
  conclusion(): Computation<TResult>;
}

export interface Activation<THandle, TResult> {
  (parent: Effect): Computation<Effect<THandle, TResult>>;
}

export interface ActivationOptions<TResult> {
  trap?(conclusion: Computation<TResult>): Computation<void>;
}

export interface Attributes extends Record<string, string | number | boolean> {
  name: string;
  type: string;
}
