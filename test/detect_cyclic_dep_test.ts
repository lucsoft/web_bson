import { assertEquals } from "../test_deps.ts";
import { Document, serialize } from "../src/bson.ts";

Deno.test(
  "[Cyclic Dependencies] Should correctly detect cyclic dependency in nested objects",
  () => {
    // Force cyclic dependency
    const a: Document = { b: {} };
    a.b.c = a;
    try {
      // Attempt to serialize cyclic dependency
      serialize(a);
    } catch (err) {
      assertEquals("cyclic dependency detected", err.message);
    }
  },
);

Deno.test(
  "[Cyclic Dependencies] Should correctly detect cyclic dependency in deeploy nested objects",
  () => {
    // Force cyclic dependency
    const a: Document = { b: { c: [{ d: {} }] } };
    a.b.c[0].d.a = a;

    try {
      // Attempt to serialize cyclic dependency
      serialize(a);
    } catch (err) {
      assertEquals("cyclic dependency detected", err.message);
    }
  },
);

Deno.test(
  "[Cyclic Dependencies] Should correctly detect cyclic dependency in nested array",
  () => {
    // Force cyclic dependency
    const a: Document = { b: {} };
    a.b.c = [a];
    try {
      // Attempt to serialize cyclic dependency
      serialize(a);
    } catch (err) {
      assertEquals("cyclic dependency detected", err.message);
    }
  },
);
