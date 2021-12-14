import { assertEquals } from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { Long } from "../src/bson.ts";

Deno.test("Long", async ({ step }) => {
  await step("accepts strings in the constructor", () => {
    assertEquals(new Long("0").toString(), "0");
    assertEquals(new Long("00").toString(), "0");
    assertEquals(new Long("-1").toString(), "-1");
    assertEquals(new Long("-1", true).toString(), "18446744073709551615");
    assertEquals(
      new Long("123456789123456789").toString(),
      "123456789123456789",
    );
    assertEquals(
      new Long("123456789123456789", true).toString(),
      "123456789123456789",
    );
    assertEquals(
      new Long("13835058055282163712").toString(),
      "-4611686018427387904",
    );
    assertEquals(
      new Long("13835058055282163712", true).toString(),
      "13835058055282163712",
    );
  });
});
