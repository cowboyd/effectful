const { test } = Deno;
import { assertEquals } from "./asserts.ts";
import { Future } from "../mod.ts";
import { use, root }  from "../effect.ts";
import type { CreateEffect } from "../api.ts";

test("basic effect", async () => {
  let on = false;

  function* activate(): CreateEffect<void, never> {
    on = true;
    return {
      attributes: {
        name: 'switch',
        type: 'Switch',
      },
      handle: void 0,
      *destroy() {
        on = false;
      },
      conclusion: Future.suspend
    }
  }


  let effect = await Future.eval(use(activate));

  assertEquals(on, true, "using the effect activates it");
  assertEquals(root.has(effect), true, "the effect is added to the root set");

  await Future.eval(effect.destroy());

  assertEquals(on, false, "destroying the effect de-activates it");

  assertEquals(root.has(effect), false, "destroyed effect was not removed");
});

// test deeply nesting activation fails up the tree

// test custom traps
