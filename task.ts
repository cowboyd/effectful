import type { Block, Context, Effect, Operation, Scope, Task } from "./api.ts";
import { assert, evaluate, shift } from "./deps.ts";
import { Future } from "./future.ts";
import { root } from "./effect.ts";

export interface TaskOptions {
  scope?: Scope;
}

export function run<T>(block: Block<T>, options: TaskOptions = {}): Task<T> {
  let { scope = createScope(root) } = options;
  let task: Task<T> | undefined = void 0;
  evaluate(function* () {
    task = yield* scope.spawn(block) as Future<Task<T>>;
  });
  assert(task, "PANIC: task creation was not synchronous");
  return task;
}

function createScope(context: Context): Scope {
  return {
    spawn(block) {
      return Future.eval(function* () {
        let { value: task } = yield* context.use(createTask(block));
        return task;
      });
    },
  };
}

function createTask<T>(block: Block<T>): Effect<Task<T>> {
  return {
    typename: "Task",
    *activate(context) {
      let operations = adapt(block(createScope(context)));
      let current: IteratorResult<Operation<unknown>, T>;
      let next = () => operations.next();
      let skip = () => {};
      let halt = () => context.close();
      let future = Future.eval(function* () {
        try {
          while (true) {
            current = next();
            if (current.done) {
              return current.value;
            } else {
              let operation = current.value;
              next = yield* shift<typeof next>(function* (k) {
                skip = () => k(() => operations.return(never()));
                try {
                  let value = yield* extract(operation, context);
                  k(() => operations.next(value));
                } catch (error) {
                  k(() => operations.throw(error));
                }
              });
            }
          }
        } finally {
          yield* halt();
        }
      });

      yield* context.ensure(function* () {
        if (!current.done) {
          skip();
          yield* future;
        }
      });

      return Object.create(future, {
        halt: {
          value: halt,
        },
        [Symbol.toStringTag]: {
          value: "Task",
        },
      });
    },
  };
}

function adapt<T, R>(i: Iterator<T, R, unknown>): Generator<T, R, unknown> {
  let generator: Generator<T, R, unknown> = {
    next(value) {
      return i.next(value);
    },
    throw(error) {
      if (i.throw) {
        return i.throw(error);
      } else {
        throw error;
      }
    },
    return(value) {
      if (i.return) {
        return i.return(value);
      } else {
        return { done: true, value };
      }
    },
    [Symbol.iterator]: () => generator,
  };
  return generator;
}

function* extract<T>(operation: Operation<T>, context: Context) {
  if (isFuture<T>(operation)) {
    return yield* operation;
  } else if (isPromise<T>(operation)) {
    return yield* shift<T>(function* (resolve, reject) {
      operation.then(resolve, reject);
    });
  } else {
    let block = operation as Block<T>;
    let { value: task } = yield* context.use(createTask(block));
    return yield* task;
  }
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return !!value && typeof (value as Promise<T>).then === "function";
}

function isFuture<T>(value: unknown): value is Future<T> {
  return isPromise(value) && value[Symbol.toStringTag] === "Future";
}

function never<T>() {
  return void (0) as unknown as T;
}
