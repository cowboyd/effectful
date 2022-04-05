import type { Effect } from "./api.ts";
import { Future } from "./future.ts";

export const root: Effect<void, never> = {
  attributes: {
    name: "root",
    type: "Root"
  },
  handle: void 0,
  children: new Set(),
  *activate(activation, options = {}) {
    let child = yield* activation(this);
    this.children.add(child);
    return child;
  },
  destroy: Future.resolve,
  conclusion: Future.suspend
}
