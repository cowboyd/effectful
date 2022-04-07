const { test } = Deno;
import { assertEquals } from "./asserts.ts";
import { Future } from "../mod.ts";
import { use, root }  from "../effect.ts";
import type { Effect } from "../api.ts";

type Switch = {
  on: boolean;
  toggle(): void;
}

let lightswitch: Effect<Switch, never> = {
  typename: "LightSwitch",
  *activate() {
    let on = true;
    return {
      value: {
        get on() { return on; },
        toggle: () => { on = !on }
      },
      output: Future.suspend,
      *deactivate() {
        on = false;
      }
    }
  }
}

test("basic effect", async () => {
  let effect = await Future.eval(use(lightswitch));
  let { value: light } = effect;

  assertEquals(light.on, true, "using the effect activates it");
  assertEquals(root.has(effect), true, "the effect is added to the root set");


  light.toggle();

  assertEquals(light.on, false, "switch did not toggle off");

  light.toggle();

  assertEquals(light.on, true, "switch did not toggle on");

  await Future.eval(effect.destroy());

  assertEquals(light.on, false, "destroying the effect de-activates it");

  assertEquals(root.has(effect), false, "destroyed effect was not removed");
});

test("when an effect is destroyed, it's children are also destroyed", async () => {
  let effect = await Future.eval(use({
    typename: "House",
    *activate(context) {
      let livingroom = yield* context.use(lightswitch);
      let diningroom = yield* context.use(lightswitch);
      return {
        value: {
          livingroom: livingroom.value,
          diningroom: diningroom.value,
        },
        output: Future.suspend,
        deactivate: Future.resolve,
      }
    }
  }));

  let { value: house } = effect;

  assertEquals(true, house.diningroom.on);
  assertEquals(true, house.livingroom.on);

  await Future.eval(effect.destroy());

  assertEquals(false, house.diningroom.on);
  assertEquals(false, house.livingroom.on);
});

// test deeply nesting activation fails up the tree

// test custom traps

// test error during activation

// test error after some time.

// test error during destruction
//   -> ensure all handlers are still run
//   -> ensure deactivation is still run
//   -> if deactivation creates effects, those are also destroyed

// test error during deactivation
