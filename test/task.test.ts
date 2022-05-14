import { describe, it } from "./bdd.ts";
import { assertEquals } from "./asserts.ts";
import { run } from "../mod.ts";

describe("Task", () => {
  it("can run a synchronous task", async () => {
    let task = run(function* () {
      return 5;
    });
    assertEquals(5, await task);
  });

  it("can call a subtask", async () => {
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
  });
});
