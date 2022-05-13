const { test } = Deno;
import { assertEquals } from "./asserts.ts";
import { run } from "../mod.ts";

test({
  name: "running a synchronous task",
  fn: async () => {
    let task = run(function* () {
      return 5;
    });
    assertEquals(5, await task);
  },
});
test({
  name: "calling a subtask",
  fn: async () => {
    let task = run(function* () {
      let left: number = yield function* () {
        return 7;
      };
      let right: number = yield function* () {
        return 6;
      };
      return yield function* () {
        return left * right;
      };
    });
    assertEquals(42, await task);
  },
});
