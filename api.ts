import type { Computation } from "./deps.ts";
import type { Future } from "./future.ts";

export interface Output<T, TReturn> {
  (): Computation<IteratorResult<T, TReturn>>;
}

export interface EffectInstance<T, TOut, TResult> {
  value: T;
  output: Output<TOut, TResult>;
  deactivate(): Computation<void>;
}

export interface EffectHandle<T = unknown, TOut = unknown, TResult = unknown> {
  value: T;
  output: Output<TOut, TResult>;
  destroy(): Computation<void>;
}

export interface Effect<THandle = unknown, TOut = unknown, TResult = unknown> {
  typename: string;
  activate(context: Context): Computation<EffectInstance<THandle, TOut, TResult>>;
}

export interface Context {
  use<T,O,R>(effect: Effect<T,O,R>): Computation<EffectHandle<T,O,R>>;
}


// Task / Operations

export interface Task<T> extends Future<T> {
  halt(): Future<void>;
}

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
