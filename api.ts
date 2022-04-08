import type { Computation } from "./deps.ts";
import type { Future } from "./future.ts";

export interface Handle<T = unknown> {
  value: T;
  destroy(): Computation<void>;
}

export interface Effect<T = unknown> {
  typename: string;
  activate(context: Context): Computation<T>;
}

export interface Context {
  use<X>(effect: Effect<X>): Computation<Handle<X>>;
  close(): Computation<void>;
  ensure(block: () => Computation<void>): Computation<void>;
}

// Task / Operations

export interface Task<T> extends Future<T> {
  halt(): Future<void>;
}

export type Operation<T> =
  | Block<T>
  | PromiseLike<T>
  | Effect<T>;

export interface Scope {
  spawn<T>(operation: Operation<T>): Operation<Task<T>>;
}

export interface Block<T> {
  (scope: Scope): Generator<Operation<unknown>, T, unknown>;
}
