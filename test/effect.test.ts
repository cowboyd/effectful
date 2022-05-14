import { beforeEach, describe, it } from "./bdd.ts";
import { assertEquals } from "./asserts.ts";
import { Future } from "../mod.ts";
import { effects, use } from "../effect.ts";
import type { Effect, Handle } from "../api.ts";

interface Switch {
  on: boolean;
  toggle(): void;
}

interface House {
  diningroom: Switch;
  livingroom: Switch;
}

let lightswitch: Effect<Switch> = {
  typename: "LightSwitch",
  *activate({ ensure }) {
    let on = true;
    yield* ensure(function* () {
      on = false;
    });
    return {
      get on() {
        return on;
      },
      toggle() {
        on = !on;
      },
    };
  },
};

describe("effect", () => {
  let handle: Handle<Switch>;
  let light: Switch;

  beforeEach(async () => {
    handle = await Future.eval(() => use(lightswitch));
    light = handle.value;
  });

  it("is activated on use", () => {
    assertEquals(handle.value.on, true, "using the effect activates it");
    assertEquals(
      effects.has(handle),
      true,
      "the effect is added to the root set",
    );
  });

  it("can access state inside the effect", () => {
    light.toggle();

    assertEquals(light.on, false, "switch did not toggle off");

    light.toggle();

    assertEquals(light.on, true, "switch did not toggle on");
  });

  it("is deactivated when the effect handle is destroyed", async () => {
    await Future.eval(handle.destroy);

    assertEquals(light.on, false, "destroying the effect de-activates it");

    assertEquals(
      effects.has(handle),
      false,
      "destroyed effect was not removed",
    );
  });
});

describe("effect with children", () => {
  let handle: Handle<House>;
  let house: House;

  beforeEach(async () => {
    handle = await Future.eval(() =>
      use({
        typename: "House",
        *activate(context) {
          let livingroom = yield* context.use(lightswitch);
          let diningroom = yield* context.use(lightswitch);
          return {
            livingroom: livingroom.value,
            diningroom: diningroom.value,
          };
        },
      })
    );
    house = handle.value;
  });

  it("activates child effects", () => {
    assertEquals(true, house.diningroom.on);
    assertEquals(true, house.livingroom.on);
  });

  it("destroys child effects when it itself is destroyed", async () => {
    await Future.eval(() => handle.destroy());

    assertEquals(false, house.diningroom.on);
    assertEquals(false, house.livingroom.on);
  });
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
