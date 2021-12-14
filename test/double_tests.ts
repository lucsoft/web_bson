import { Double } from "../src/bson.ts";

Deno.test("Double", () => {
  Deno.test("Constructor", () => {
    var value = 42.3456;

    Deno.test("Primitive number", () => {
      assert(new Double(value).valueOf()).to.equal(value);
    });

    Deno.test("Number object", () => {
      assert(new Double(new Number(value)).valueOf()).to.equal(value);
    });
  });

  Deno.test("toString", () => {
    Deno.test("should serialize to a string", () => {
      const testNumber = Math.random() * Number.MAX_VALUE;
      const double = new Double(testNumber);
      assert(double.toString()).to.equal(testNumber.toString());
    });

    const testRadices = [2, 8, 10, 16, 22];

    for (const radix of testRadices) {
      Deno.test(`should support radix argument: ${radix}`, () => {
        const testNumber = Math.random() * Number.MAX_VALUE;
        const double = new Double(testNumber);
        assert(double.toString(radix)).to.equal(testNumber.toString(radix));
      });
    }
  });
});
