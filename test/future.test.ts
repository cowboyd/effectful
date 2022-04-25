const { test } = Deno;
import { assertEquals } from "./asserts.ts";
import { Future } from "../future.ts";
import { shift } from "../deps.ts";

test("Future.eval()", async () => {
  assertEquals(
    5,
    await Future.eval(function* () {
      return 5;
    }),
  );
  assertEquals(
    5,
    await Future.eval(function* () {
      yield* sleep();
      return 5;
    }),
  );

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

function* sleep() {
  yield* shift(function* (k) {
    setTimeout(k, 0);
  });
}
