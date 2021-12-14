import {} from "../src/bson.ts";
const Int32 = Int32;

Deno.test("Int32", () => {
  context("Constructor", () => {
    const strHexValue = "0x2a";
    const hexValue = 0x2a;
    const octalValue = 0o52;
    const value = 42;
    const upperBoundValue = 0x7fffffff;
    const lowerBoundValue = -0x80000000;
    const outOfUpperBoundValue = 0x80000000;
    const outOfLowerBoundValue = -0x80000001;

    Deno.test("should accept primitive numbers", () =>
      assert(new Int32(value).valueOf()).to.equal(value);
    });

    Deno.test("should accept number objects", () =>
      assert(new Int32(new Number(value)).valueOf()).to.equal(value);
    });

    Deno.test("should accept string Hex", () =>
      assert(new Int32(strHexValue).valueOf()).to.equal(value);
    });

    Deno.test("should accept hex", () =>
      assert(new Int32(hexValue).valueOf()).to.equal(value);
    });

    Deno.test("should accept octal", () =>
      assert(new Int32(octalValue).valueOf()).to.equal(value);
    });

    Deno.test(
      "should accept int32 minimum input of -0x80000000",
      () =>
        assert(new Int32(lowerBoundValue).valueOf()).to.equal(lowerBoundValue);
      },
    );

    Deno.test(
      "should accept int32 maximum input of 0x7fffffff",
      () =>
        assert(new Int32(upperBoundValue).valueOf()).to.equal(upperBoundValue);
      },
    );

    Deno.test(
      "should truncate the input bits to int32 for inputs smaller than -0x80000000",
      () =>
        assert(new Int32(outOfLowerBoundValue).valueOf()).to.equal(0x7fffffff);
      },
    );

    Deno.test(
      "should truncate the input bits to int32 for inputs larger than 0x7fffffff",
      () =>
        assert(new Int32(outOfUpperBoundValue).valueOf()).to.equal(-0x80000000);
      },
    );

    Deno.test("should equal zero", () => {
      const prop = "key";
      const zero = serialize({ [prop]: new Int32(0) }).toString();
      // should equal zero
      ["fortyTwo", "42fortyTwo", "0", 0, Infinity, "Infinity"].forEach(
        (value) => {
          assert(serialize({ [prop]: new Int32(value) }).toString()).to
            .equal(zero);
          assert(serialize({ [prop]: new Int32(+value) }).toString()).to
            .equal(zero);
        },
      );
    });

    Deno.test("should have serialization consistency across different representations of 42", () => {
      const prop = "key";
      const fortyTwo = serialize({ [prop]: new Int32(value) }).toString();
      // should equal fortyTwo
      [strHexValue, hexValue, octalValue].forEach((value) => {
        assert(serialize({ [prop]: new Int32(value) }).toString()).to
          .equal(fortyTwo);
        assert(serialize({ [prop]: new Int32(+value) }).toString()).to
          .equal(fortyTwo);
      });
    });
  });

  Deno.test("toString", () => {
    Deno.test("should serialize to a string", () => {
      const testNumber = 0x7fffffff;
      const int32 = new Int32(testNumber);
      assert(int32.toString()).to.equal(testNumber.toString());
    });

    const testRadices = [2, 8, 10, 16, 22];

    for (const radix of testRadices) {
      Deno.test(`should support radix argument: ${radix}`, () => {
        const testNumber = 0x7fffffff;
        const int32 = new Int32(testNumber);
        assert(int32.toString(radix)).to.equal(testNumber.toString(radix));
      });
    }
  });
});
