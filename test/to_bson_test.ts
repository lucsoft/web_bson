import { ObjectId } from "../src/bson.ts";

Deno.test("toBSON", () => {
  /**
   * @ignore
   */
  Deno.test(
    "Should correctly handle toBson function for an object",
    () =>
      // Test object
      var doc = {
        hello: new ObjectId(),
        a: 1,
      };

      // Add a toBson method to the object
      doc.toBSON = () => {
        return { b: 1 };
      };

      // Serialize the data
      var serialized_data = serialize(doc, false, true);
      var deserialized_doc = deserialize(serialized_data);
      assert({ b: 1 }).to.deep.equal(deserialized_doc);

      // Serialize the data
      serialized_data = serialize(doc, false, true);
      deserialized_doc = deserialize(serialized_data);
      assert({ b: 1 }).to.deep.equal(deserialized_doc);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should correctly handle embedded toBson function for an object",
    () =>
      // Test object
      var doc = {
        hello: new ObjectId(),
        a: 1,
        b: {
          d: 1,
        },
      };

      // Add a toBson method to the object
      doc.b.toBSON = () => {
        return { e: 1 };
      };

      // Serialize the data
      var serialized_data = serialize(doc, false, true);
      var deserialized_doc = deserialize(serialized_data);
      assert({ e: 1 }).to.deep.equal(deserialized_doc.b);

      serialized_data = serialize(doc, false, true);
      deserialized_doc = deserialize(serialized_data);
      assert({ e: 1 }).to.deep.equal(deserialized_doc.b);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should correctly serialize when embedded non object returned by toBSON",
    () =>
      // Test object
      var doc = {
        hello: new ObjectId(),
        a: 1,
        b: {
          d: 1,
        },
      };

      // Add a toBson method to the object
      doc.b.toBSON = () => {
        return "hello";
      };

      // Serialize the data
      var serialized_data = serialize(doc, false, true);
      var deserialized_doc = deserialize(serialized_data);
      assert("hello").to.deep.equal(deserialized_doc.b);

      // Serialize the data
      serialized_data = serialize(doc, false, true);
      deserialized_doc = deserialize(serialized_data);
      assert("hello").to.deep.equal(deserialized_doc.b);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should fail when top level object returns a non object type",
    () =>
      // Test object
      var doc = {
        hello: new ObjectId(),
        a: 1,
        b: {
          d: 1,
        },
      };

      // Add a toBson method to the object
      doc.toBSON = () => {
        return "hello";
      };

      var test1 = false;
      var test2 = false;

      try {
        var serialized_data = serialize(doc, false, true);
        deserialize(serialized_data);
      } catch (err) {
        test1 = true;
      }

      try {
        serialized_data = serialize(doc, false, true);
        deserialize(serialized_data);
      } catch (err) {
        test2 = true;
      }

      assert(true).to.equal(test1);
      assert(true).to.equal(test2);
    },
  );
});
