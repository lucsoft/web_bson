import { assertEquals } from "../test_deps.ts";
import { Int32, serialize } from "../src/bson.ts";
const strHexValue = "0x2a";
const hexValue = 0x2a;
const octalValue = 0o5_2;
const value = 42;
const upperBoundValue = 0x7f_ff_ff_ff;
const lowerBoundValue = -0x80_00_00_00;
const outOfUpperBoundValue = 0x80_00_00_00;
const outOfLowerBoundValue = -0x80_00_00_01;

Deno.test("[Int32-Constructor] should accept primitive numbers", () => {
  assertEquals(new Int32(value).valueOf(), value);
});

Deno.test("[Int32-Constructor] should accept number objects", () => {
  assertEquals(new Int32(Number(value)).valueOf(), value);
});

Deno.test("[Int32-Constructor] should accept string Hex", () => {
  assertEquals(new Int32(strHexValue).valueOf(), value);
});

Deno.test("[Int32-Constructor] should accept hex", () => {
  assertEquals(new Int32(hexValue).valueOf(), value);
});

Deno.test("[Int32-Constructor] should accept octal", () => {
  assertEquals(new Int32(octalValue).valueOf(), value);
});

Deno.test(
  "[Int32-Constructor] should accept int32 minimum input of -0x80000000",
  () => {
    assertEquals(new Int32(lowerBoundValue).valueOf(), lowerBoundValue);
  },
);

Deno.test(
  "[Int32-Constructor] should accept int32 maximum input of 0x7fffffff",
  () => {
    assertEquals(new Int32(upperBoundValue).valueOf(), upperBoundValue);
  },
);

Deno.test(
  "[Int32-Constructor] should truncate the input bits to int32 for inputs smaller than -0x80000000",
  () => {
    assertEquals(new Int32(outOfLowerBoundValue).valueOf(), 0x7f_ff_ff_ff);
  },
);

Deno.test(
  "[Int32-Constructor] should truncate the input bits to int32 for inputs larger than 0x7fffffff",
  () => {
    assertEquals(new Int32(outOfUpperBoundValue).valueOf(), -0x80_00_00_00);
  },
);

Deno.test("[Int32-Constructor] should equal zero", () => {
  const prop = "key";
  const zero = serialize({ [prop]: new Int32(0) }).toString();
  // should equal zero
  ["fortyTwo", "42fortyTwo", "0", 0, Infinity, "Infinity"].forEach(
    (value) => {
      assertEquals(
        serialize({ [prop]: new Int32(value) }).toString(),
        zero,
      );
      assertEquals(
        serialize({ [prop]: new Int32(+value) }).toString(),
        zero,
      );
    },
  );
});

Deno.test("[Int32-Constructor] should have serialization consistency across different representations of 42", () => {
  const prop = "key";
  const fortyTwo = serialize({ [prop]: new Int32(value) }).toString();
  // should equal fortyTwo
  [strHexValue, hexValue, octalValue].forEach((value) => {
    assertEquals(
      serialize({ [prop]: new Int32(value) }).toString(),
      fortyTwo,
    );
    assertEquals(
      serialize({ [prop]: new Int32(+value) }).toString(),
      fortyTwo,
    );
  });
});

Deno.test("[Int32-toString] should serialize to a string", () => {
  const testNumber = 0x7f_ff_ff_ff;
  const int32 = new Int32(testNumber);
  assertEquals(int32.toString(), testNumber.toString());
});

const testRadices = [2, 8, 10, 16, 22];

for (const radix of testRadices) {
  Deno.test(`[Int32-toString] should support radix argument: ${radix}`, () => {
    const testNumber = 0x7f_ff_ff_ff;
    const int32 = new Int32(testNumber);
    assertEquals(int32.toString(radix), testNumber.toString(radix));
  });
}
