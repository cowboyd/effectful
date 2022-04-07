import type { Effect, EffectHandle, Context } from "./api.ts";
import { Computation, reset } from "./deps.ts";

export const root = new Set<EffectHandle>();

export function* use<T, O, R>(effect: Effect<T, O, R>): Computation<EffectHandle<T, O, R>> {
  return yield* createContext(root).use(effect);
}

function createContext(effects: Set<EffectHandle> = new Set<EffectHandle>()): Context {
  return {
    *use(effect) {
      let children = new Set<EffectHandle>();
      let context = createContext(children);
      let instance = yield* effect.activate(context);

      let { value, output, deactivate } = instance;

      let handle = {
        status: "active",
        effect,
        value,
        output,
        *destroy() {
          handle.status = "deactivating";
          try {
            for (let child of [...children].reverse()) {
              yield* child.destroy();
            }
            yield* deactivate();
          } finally {
            handle.status = "deactivated";
            effects.delete(handle);
          }
        }
      };
      effects.add(handle);
      yield* reset(function*() {
        try {
          for (let x = yield* output(); !x.done; yield* output());
        } finally {
          effects.delete(handle);
        }
      });
      return handle;
    }
  }
}
