import { assertEquals } from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { Double } from "../src/bson.ts";

Deno.test("Double", async ({ step }) => {
  await step("Constructor", async ({ step }) => {
    const value = 42.3456;

    await step("Primitive number", () => {
      assertEquals(new Double(value).valueOf(), value);
    });

    await step("Number object", () => {
      assertEquals(new Double(Number(value)).valueOf(), value);
    });
  });

  await step("toString", async ({ step }) => {
    await step("should serialize to a string", () => {
      const testNumber = Math.random() * Number.MAX_VALUE;
      const double = new Double(testNumber);
      assertEquals(double.toString(), testNumber.toString());
    });

    const testRadices = [2, 8, 10, 16, 22];

    for (const radix of testRadices) {
      await step(`should support radix argument: ${radix}`, () => {
        const testNumber = Math.random() * Number.MAX_VALUE;
        const double = new Double(testNumber);
        assertEquals(double.toString(radix), testNumber.toString(radix));
      });
    }
  });
});
