import { assertEquals } from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { Double } from "../src/bson.ts";

const value = 42.3456;
Deno.test("[Double-Constructor] Primitive number", () => {
  assertEquals(new Double(value).valueOf(), value);
});

Deno.test("[Double-Constructor]Number object", () => {
  assertEquals(new Double(Number(value)).valueOf(), value);
});

Deno.test("[Double-toString] should serialize to a string", () => {
  const testNumber = Math.random() * Number.MAX_VALUE;
  const double = new Double(testNumber);
  assertEquals(double.toString(), testNumber.toString());
});

const testRadices = [2, 8, 10, 16, 22];

for (const radix of testRadices) {
  Deno.test(`[Double-toString]should support radix argument: ${radix}`, () => {
    const testNumber = Math.random() * Number.MAX_VALUE;
    const double = new Double(testNumber);
    assertEquals(double.toString(radix), testNumber.toString(radix));
  });
}
