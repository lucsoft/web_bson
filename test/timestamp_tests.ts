import {
  assert,
  assertEquals,
  equal,
} from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { Long, Timestamp } from "../src/bson.ts";

Deno.test("Timestamp", () => {
  Deno.test("should have a MAX_VALUE equal to Long.MAX_UNSIGNED_VALUE", () => {
    assertEquals(Timestamp.MAX_VALUE, Long.MAX_UNSIGNED_VALUE);
  });

  Deno.test("should always be an unsigned value", () => {
    [
      //   new Timestamp(),
      new Timestamp(0xff, 0xffffffff),
      new Timestamp(0xffffffff, 0xffffffff),
      new Timestamp(-1, -1),
      new Timestamp(new Timestamp(0xffffffff, 0xffffffff)),
      new Timestamp(new Long(0xffffffff, 0xfffffffff, false)),
      new Timestamp(new Long(0xffffffff, 0xfffffffff, true)),
      new Timestamp({ t: 0xffffffff, i: 0xfffffffff }),
      new Timestamp({ t: -1, i: -1 }),
    ].forEach((timestamp) => {
      assert(timestamp.unsigned == true);
    });
  });

  Deno.test("should print out an unsigned number", () => {
    const timestamp = new Timestamp(0xffffffff, 0xffffffff);
    assertEquals(timestamp.toString(), "18446744073709551615");
    equal(timestamp.toJSON(), {
      $timestamp: "18446744073709551615",
    });
  });
});
