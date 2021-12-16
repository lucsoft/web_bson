import { assert, assertEquals, assertThrows } from "../test_deps.ts";
import {
  BSONError,
  deserialize,
  DeserializeOptions,
  Document,
  serialize,
} from "../src/bson.ts";
import { decodeHexString } from "../utils.ts";

const replacementChar = "\u{FFFD}\u{FFFD}\u{FFFD}";
const replacementString = `hi${replacementChar}bye`;
const twoCharReplacementStr = `${replacementChar}${replacementChar}bye`;
const sampleValidUTF8 = serialize({
  a: "😎",
  b: "valid utf8",
  c: 12345,
});

Deno.test("[UTF8 validation] should throw error if true and false mixed for validation option passed in with valid utf8 example", () => {
  const mixedTrueFalse1 = {
    validation: { utf8: { a: false, b: true } },
  } as unknown as DeserializeOptions;
  const mixedTrueFalse2 = {
    validation: { utf8: { a: true, b: true, c: false } },
  } as unknown as DeserializeOptions;
  assertThrows(
    () => deserialize(sampleValidUTF8, mixedTrueFalse1),
    BSONError,
    "Invalid UTF-8 validation option - keys must be all true or all false",
  );
  assertThrows(
    () => deserialize(sampleValidUTF8, mixedTrueFalse2),
    BSONError,
    "Invalid UTF-8 validation option - keys must be all true or all false",
  );
});

Deno.test("[UTF8 validation] should correctly handle validation if validation option contains all T or all F with valid utf8 example", () => {
  const allTrue: DeserializeOptions = {
    validation: { utf8: { a: true, b: true, c: true } },
  };
  const allFalse: DeserializeOptions = {
    validation: { utf8: { a: false, b: false, c: false, d: false } },
  };
  assert(deserialize(sampleValidUTF8, allTrue));
  assert(deserialize(sampleValidUTF8, allFalse));
});

Deno.test("[UTF8 validation] should throw error if empty utf8 validation option passed in", () => {
  const doc = { a: "validation utf8 option cant be empty" };
  const serialized = serialize(doc);
  const emptyUTF8validation = { validation: { utf8: {} } };
  assertThrows(
    () => deserialize(serialized, emptyUTF8validation),
    BSONError,
    "UTF-8 validation setting cannot be empty",
  );
});

Deno.test("[UTF8 validation] should throw error if non-boolean utf8 field for validation option is specified for a key", () => {
  const utf8InvalidOptionObj = {
    validation: { utf8: { a: { a: true } } },
  } as unknown as DeserializeOptions;
  const utf8InvalidOptionArr = {
    validation: { utf8: { a: ["should", "be", "boolean"], b: true } },
  } as unknown as DeserializeOptions;
  const utf8InvalidOptionStr = {
    validation: { utf8: { a: "bad value", b: true } },
  } as unknown as DeserializeOptions;

  assertThrows(
    () => deserialize(sampleValidUTF8, utf8InvalidOptionObj),
    BSONError,
    "Invalid UTF-8 validation option, must specify boolean values",
    1 as unknown as string,
  );
  assertThrows(
    () => deserialize(sampleValidUTF8, utf8InvalidOptionArr),
    BSONError,
    "Invalid UTF-8 validation option, must specify boolean values",
    1 as unknown as string,
  );
  assertThrows(
    () => deserialize(sampleValidUTF8, utf8InvalidOptionStr),
    BSONError,
    "Invalid UTF-8 validation option, must specify boolean values",
    1 as unknown as string,
  );
});

const testInputs: {
  description: string;
  buffer: Uint8Array;
  expectedObjectWithReplacementChars: Document;
  containsInvalid: boolean;
  testCases: ({ validation: DeserializeOptions; behavior: string })[];
}[] = [
  {
    description: "object with valid utf8 top level keys",
    buffer: decodeHexString(
      "2e0000000276616c69644b65794368617200060000006162636465001076616c69644b65794e756d003930000000",
    ),
    expectedObjectWithReplacementChars: {
      validKeyChar: "abcde",
      validKeyNum: 12345,
    },
    containsInvalid: false,
    testCases: [],
  },
  {
    description: "object with invalid utf8 top level key",
    buffer: decodeHexString(
      "420000000276616c69644b657943686172000600000061626364650002696e76616c696455746638546f704c6576656c4b657900090000006869f09f906279650000",
    ),
    expectedObjectWithReplacementChars: {
      validKeyChar: "abcde",
      invalidUtf8TopLevelKey: replacementString,
    },
    containsInvalid: true,
    testCases: [
      {
        validation: {
          validation: { utf8: { validKeyChar: false } },
        },
        behavior:
          "throw error when only valid toplevel key has validation disabled",
      },
      {
        validation: {
          validation: {
            utf8: { invalidUtf8TopLevelKey: false },
          },
        },
        behavior:
          "not throw error when only invalid toplevel key has validation disabled",
      },
      {
        validation: {
          validation: {
            utf8: {
              validKeyChar: false,
              invalidUtf8TopLevelKey: false,
            },
          },
        },
        behavior:
          "not throw error when both valid and invalid toplevel keys have validation disabled",
      },
      {
        validation: {
          validation: { utf8: { validKeyChar: true } },
        },
        behavior:
          "not throw error when only valid toplevel key has validation enabled",
      },
      {
        validation: {
          validation: { utf8: { invalidUtf8TopLevelKey: true } },
        },
        behavior:
          "throw error when only invalid toplevel key has validation enabled",
      },
      {
        validation: {
          validation: {
            utf8: { validKeyChar: true, invalidUtf8TopLevelKey: true },
          },
        },
        behavior:
          "throw error when both valid and invalid toplevel keys have validation enabled",
      },
    ],
  },
  {
    description: "object with invalid utf8 in nested key object",
    buffer: decodeHexString(
      "460000000276616c69644b657943686172000600000061626364650003746f704c766c4b6579001e00000002696e76616c69644b657900090000006869f09f90627965000000",
    ),
    expectedObjectWithReplacementChars: {
      validKeyChar: "abcde",
      topLvlKey: {
        invalidKey: replacementString,
      },
    },
    containsInvalid: true,
    testCases: [
      {
        validation: { validation: { utf8: { validKeyChar: false } } },
        behavior:
          "throw error when only valid toplevel key has validation disabled",
      },
      {
        validation: { validation: { utf8: { topLvlKey: false } } },
        behavior:
          "not throw error when only toplevel key with invalid subkey has validation disabled",
      },
      {
        validation: { validation: { utf8: { invalidKey: false } } },
        behavior:
          "throw error when specified invalid key for disabling validation is not a toplevel key",
      },
      {
        validation: {
          validation: { utf8: { validKeyChar: false, topLvlKey: false } },
        },
        behavior:
          "not throw error when both valid toplevel key and toplevel key with invalid subkey have validation disabled",
      },
      {
        validation: { validation: { utf8: { validKeyChar: true } } },
        behavior:
          "not throw error when only valid toplevel key has validation enabled",
      },
      {
        validation: { validation: { utf8: { topLvlKey: true } } },
        behavior:
          "throw error when only toplevel key containing nested invalid key has validation enabled",
      },
      {
        validation: {
          validation: { utf8: { validKeyChar: true, topLvlKey: true } },
        },
        behavior:
          "throw error when both valid key and nested invalid toplevel keys have validation enabled",
      },
    ],
  },
  {
    description: "object with invalid utf8 in two top level keys",
    buffer: decodeHexString(
      "5e0000000276616c69644b65794368617200040000006162630002696e76616c696455746638546f704c766c3100090000006869f09f906279650002696e76616c696455746638546f704c766c32000a000000f09f90f09f906279650000",
    ),
    expectedObjectWithReplacementChars: {
      validKeyChar: "abc",
      invalidUtf8TopLvl1: replacementString,
      invalidUtf8TopLvl2: twoCharReplacementStr,
    },
    containsInvalid: true,
    testCases: [
      {
        validation: { validation: { utf8: { invalidUtf8TopLvl1: false } } },
        behavior:
          "throw error when only one of two invalid top level keys has validation disabled",
      },
      {
        validation: {
          validation: {
            utf8: { invalidUtf8TopLvl1: false, invalidUtf8TopLvl2: false },
          },
        },
        behavior:
          "not throw error when all invalid top level keys have validation disabled",
      },
      {
        validation: { validation: { utf8: { validKeyChar: true } } },
        behavior:
          "not throw error when only the valid top level key has enabled validation",
      },
      {
        validation: {
          validation: {
            utf8: { validKeyChar: true, invalidUtf8TopLvl1: true },
          },
        },
        behavior:
          "throw error when only the valid toplevel key and one of the invalid keys has enabled validation",
      },
    ],
  },
  {
    description: "object with valid utf8 in top level key array",
    buffer: decodeHexString(
      "4a0000000276616c69644b657943686172000600000061626364650004746f704c766c41727200220000000230000300000068690002310005000000f09f988e00103200393000000000",
    ),
    expectedObjectWithReplacementChars: {
      validKeyChar: "abcde",
      topLvlArr: ["hi", "😎", 12345],
    },
    containsInvalid: false,
    testCases: [
      {
        validation: {
          validation: { utf8: { validKeyChar: false, topLvlArr: false } },
        },
        behavior:
          "not throw error when both valid top level keys have validation disabled",
      },
      {
        validation: {
          validation: { utf8: { validKeyChar: true, topLvlArr: true } },
        },
        behavior:
          "not throw error when both valid top level keys have validation enabled",
      },
    ],
  },
  {
    description: "object with invalid utf8 in top level key array",
    buffer: decodeHexString(
      "4e0000000276616c69644b657943686172000600000061626364650004746f704c766c417272002600000002300003000000686900023100090000006869f09f9062796500103200393000000000",
    ),
    expectedObjectWithReplacementChars: {
      validKeyChar: "abcde",
      topLvlArr: ["hi", replacementString, 12345],
    },
    containsInvalid: true,
    testCases: [
      {
        validation: { validation: { utf8: { topLvlArr: false } } },
        behavior:
          "not throw error when invalid toplevel key array has validation disabled",
      },
      {
        validation: { validation: { utf8: { topLvlArr: true } } },
        behavior:
          "throw error when invalid toplevel key array has validation enabled",
      },
      {
        validation: {
          validation: { utf8: { validKeyChar: true, topLvlArr: true } },
        },
        behavior:
          "throw error when both valid and invalid toplevel keys have validation enabled",
      },
    ],
  },
  {
    description: "object with invalid utf8 in nested key array",
    buffer: decodeHexString(
      "5a0000000276616c69644b657943686172000600000061626364650003746f704c766c4b65790032000000046e65737465644b6579417272001f00000002300003000000686900023100090000006869f09f9062796500000000",
    ),
    expectedObjectWithReplacementChars: {
      validKeyChar: "abcde",
      topLvlKey: {
        nestedKeyArr: ["hi", replacementString],
      },
    },
    containsInvalid: true,
    testCases: [
      {
        validation: { validation: { utf8: { topLvlKey: false } } },
        behavior:
          "not throw error when toplevel key for array with invalid key has validation disabled",
      },
      {
        validation: { validation: { utf8: { topLvlKey: true } } },
        behavior:
          "throw error when toplevel key for array with invalid key has validation enabled",
      },
      {
        validation: { validation: { utf8: { nestedKeyArr: false } } },
        behavior:
          "throw error when specified invalid key for disabling validation is not a toplevel key",
      },
      {
        validation: {
          validation: { utf8: { validKeyChar: true, topLvlKey: true } },
        },
        behavior:
          "throw error when both toplevel key and key with nested key with invalid array have validation enabled",
      },
    ],
  },
];

for (
  const {
    description,
    containsInvalid,
    buffer,
    expectedObjectWithReplacementChars,
  } of testInputs
) {
  const behavior = "validate utf8 if no validation option given";
  Deno.test(`should ${behavior} for ${description}`, () => {
    if (containsInvalid) {
      assertThrows(
        () => deserialize(buffer),
        BSONError,
        "Invalid UTF-8 string in BSON document",
      );
    } else {
      assertEquals(deserialize(buffer), expectedObjectWithReplacementChars);
    }
  });
}

for (
  const { description, buffer, expectedObjectWithReplacementChars }
    of testInputs
) {
  const behavior = "not validate utf8 and not throw an error";
  Deno.test(`should ${behavior} for ${description} with global utf8 validation disabled`, () => {
    const validation = Object.freeze({
      validation: Object.freeze({ utf8: false }),
    });
    assertEquals(
      deserialize(buffer, validation),
      expectedObjectWithReplacementChars,
    );
  });
}

for (
  const {
    description,
    containsInvalid,
    buffer,
    expectedObjectWithReplacementChars,
  } of testInputs
) {
  const behavior = containsInvalid
    ? "throw error"
    : "validate utf8 with no errors";
  Deno.test(`should ${behavior} for ${description} with global utf8 validation enabled`, () => {
    const validation = Object.freeze({
      validation: Object.freeze({ utf8: true }),
    });
    if (containsInvalid) {
      assertThrows(
        () => deserialize(buffer, validation),
        BSONError,
        "Invalid UTF-8 string in BSON document",
      );
    } else {
      assertEquals(
        deserialize(buffer, validation),
        expectedObjectWithReplacementChars,
      );
    }
  });
}

for (
  const { description, buffer, expectedObjectWithReplacementChars, testCases }
    of testInputs
) {
  for (const { behavior, validation } of testCases) {
    Deno.test(`should ${behavior} for ${description}`, () => {
      Object.freeze(validation);
      Object.freeze(validation.validation?.utf8);
      if (behavior.substring(0, 3) === "not") {
        assertEquals(
          deserialize(buffer, validation),
          expectedObjectWithReplacementChars,
        );
      } else {
        assertThrows(
          () => deserialize(buffer, validation),
          BSONError,
          "Invalid UTF-8 string in BSON document",
        );
      }
    });
  }
}
