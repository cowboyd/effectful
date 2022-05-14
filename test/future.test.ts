import { describe, it } from "./bdd.ts";
import { assertEquals } from "./asserts.ts";
import { Future } from "../future.ts";
import { shift } from "../deps.ts";

describe("Future.eval()", () => {
  it("can compute a synchronous value", async () => {
    assertEquals(
      5,
      await Future.eval(function* () {
        return 5;
      }),
    );
  });

  it("can compute an asynchronous value", async () => {
    assertEquals(
      5,
      await Future.eval(function* () {
        yield* sleep();
        return 5;
      }),
    );
  });

  it("can compute a value when there is asynchrony in a finally", async () => {
    assertEquals(
      5,
      await Future.eval(function* () {
        try {
          return 5;
        } finally {
          yield* sleep();
        }
      }),
    );
  });
});

function* sleep() {
  yield* shift(function* (k) {
    setTimeout(k, 0);
  });
}
