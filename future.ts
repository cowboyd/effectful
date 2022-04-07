import { Computation, evaluate, K, reset, shift } from "./deps.ts";

export interface Future<T> extends Promise<T>, Computation<T> {}

export type Resolve<T> = K<T, void>;
export type Reject = Resolve<Error>;

export interface NewFuture<T> {
  future: Future<T>;
  resolve: Resolve<T>;
  reject: Reject;
}

type Result<T> = {
  type: "resolved";
  value: T;
} | {
  type: "rejected";
  error: Error;
};

export function createFuture<T>(): NewFuture<T> {
  let result: Result<T>;
  let watchers: { resolve: K<T>; reject: K<Error> }[] = [];
  let notifying = false;

  function* notify() {
    if (notifying) {
      return;
    }
    notifying = true;
    try {
      for (
        let watcher = watchers.shift();
        watcher;
        watcher = watchers.shift()
      ) {
        if (result.type === "resolved") {
          watcher.resolve(result.value);
        } else {
          watcher.reject(result.error);
        }
      }
    } finally {
      notifying = false;
    }
  }

  return evaluate<NewFuture<T>>(function* () {
    let settle = yield* reset<K<Result<T>>>(function* () {
      result = yield* shift<Result<T>>(function* (k) {
        return k;
      });
      yield* notify();
    });

    let block: Computation<T> = {
      *[Symbol.iterator]() {
        return yield* shift<T>(function* (resolve, reject) {
          watchers.push({ resolve, reject });
          if (result) {
            yield* notify();
          }
        });
      },
    };

    let promise = lazy(() =>
      new Promise<T>((resolve, reject) => {
        evaluate(function* () {
          try {
            resolve(yield* block);
          } catch (error) {
            reject(error);
          }
        });
      })
    );

    let future: Future<T> = {
      ...block,
      then: (...args) => promise().then(...args),
      catch: (...args) => promise().catch(...args),
      finally: (...args) => promise().finally(...args),
      [Symbol.toStringTag]: "Future",
    };

    Reflect.setPrototypeOf(future, Future.prototype);

    return {
      future,
      resolve: (value: T) => settle({ type: "resolved", value }),
      reject: (error: Error) => settle({ type: "rejected", error }),
    };
  });
}

export class Future<T> {
  static resolve(value: void): Future<void>;
  static resolve<T>(value: T): Future<T>;
  static resolve<T>(value?: T): Future<T | undefined> {
    return new Future((resolve) => resolve(value as T));
  }

  static reject<T = unknown>(error: Error): Future<T> {
    return new Future<T>((_, reject) => reject(error));
  }

  static suspend(): Future<never> {
    return new Future(() => {});
  }

  static eval<T>(compute: () => Computation<T>): Future<T> {
    return new Future((resolve, reject) => {
      evaluate(function* () {
        try {
          resolve(yield* compute());
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  constructor(fn: (resolve: Resolve<T>, reject: Reject) => void) {
    let { future, resolve, reject } = createFuture<T>();
    fn(resolve, reject);
    return future;
  }
}

function lazy<T>(create: () => T): () => T {
  let thunk = () => {
    let value = create();
    thunk = () => value;
    return value;
  };
  return () => thunk();
}
