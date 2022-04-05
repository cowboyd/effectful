import type { Effect } from "./api.ts";
import { Future } from "./future.ts";
import { reset } from "./deps.ts";

export const root: Effect<void, never> = {
  attributes: {
    name: "root",
    type: "Root"
  },
  handle: void 0,
  children: new Set(),
  *use(activation, options = {}) {
    let { trap = x => x } = options;

    let child = yield* activation(this);
    root.children.add(child);

    yield* reset(function*() {
      try {
        yield* trap(child.conclusion());
      } catch (error) {
        console.warn("TODO: settle this effect as errored", error);
      } finally {
        root.children.delete(child);
      }
    });

    return child;
  },
  destroy: Future.resolve,
  conclusion: Future.suspend
}
