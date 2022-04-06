import type { Effect, UseEffect, Context } from "./api.ts";
import { Computation, reset } from "./deps.ts";

export const root = new Set<Effect>();

export function* use<T, R>(activate: UseEffect<T, R>): Computation<Effect<T, R>> {
  return yield* createContext(root).use(activate);
}

function createContext(effects: Set<Effect> = new Set<Effect>()): Context {
  return {
    *use(activate) {
      let context = createContext();
      let effect = yield* activate(context);
      let { destroy } = effect;
      let child = {
        ...effect,
        *destroy() {
          try {
            yield* destroy.call(effect);
          } finally {
            effects.delete(child);
          }
        }
      };
      effects.add(child);
      yield* reset(function*() {
        try {
          yield* child.conclusion();
        } finally {
          effects.delete(child);
        }
      });
      return child;
    }
  }
}
