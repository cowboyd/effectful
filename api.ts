import type { Computation } from "./deps.ts";
import type { Future } from "./future.ts";

export interface Effect<THandle = unknown, TResult = unknown> {
  handle: THandle;
  attributes: Attributes;
  children: Set<Effect>;
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

export interface Task<T> extends Future<T> {
  halt(): Future<void>;
}

// Operations

export type Operation<T> = OperationFunction<T> | PromiseLike<T> | Future<T> | Resource<T>;

export interface Scope {
  spawn<T>(operation: Operation<T>): Operation<Task<T>>;
}

export interface OperationFunction<T> {
  (scope: Scope): Generator<Operation<any>, T, any>;
}

export interface Resource<T> {
  init: Operation<T>;
}
