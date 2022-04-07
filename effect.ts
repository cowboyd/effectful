import type { Context, Effect, Handle } from "./api.ts";
import { Computation, evaluate, reset, shift } from "./deps.ts";
import { Future } from "./future.ts";

export const effects = new Set<Handle>();

export const root = evaluate<Context>(() => createContext(effects));

export function* use<T>(effect: Effect<T>): Computation<Handle<T>> {
  return yield* root.use(effect);
}

function* createContext(effects?: Set<Handle>): Computation<Context> {
  return yield* reset(function* () {
    let handles = effects ?? new Set();
    let ensured: Array<() => Computation<void>> = [];

    yield* shift<void>(function* (close) {
      return {
        close,
        *use(effect) {
          let context = yield* createContext();
          let value = yield* effect.activate(context);

          let handle = {
            value,
            *destroy() {
              handles.delete(handle);
              return yield* context.close();
            },
          };

          handles.add(handle);

          return handle;
        },
        *ensure(block) {
          ensured.push(block);
        },
      } as Context;
    });

    yield* shift(function* () {
      return Future.eval(function* () {
        for (let ensure of ensured) {
          yield* ensure();
        }
        for (let child of [...handles].reverse()) {
          yield* child.destroy();
        }
      });
    });
  });
}
