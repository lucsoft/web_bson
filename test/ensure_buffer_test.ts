/* global SharedArrayBuffer */

const { Buffer } = require("buffer");
const { ensureBuffer } = require("../register-bson");
import {} from "../src/bson.ts";
const BSONTypeError = BSON.BSONTypeError;

Deno.test("ensureBuffer tests", () => {
  Deno.test("should be a function", () => {
    assert(ensureBuffer).to.be.a("function");
  });

  Deno.test("should return a view over the exact same memory when a Buffer is passed in", () => {
    const bufferIn = Buffer.alloc(10);
    let bufferOut;

    assert(() => {
      bufferOut = ensureBuffer(bufferIn);
    }).to.not.throw(BSONTypeError);

    assert(bufferOut).to.be.an.instanceOf(Buffer);
    assert(bufferOut.buffer).to.equal(bufferIn.buffer);
    assert(bufferOut.byteLength).to.equal(bufferIn.byteLength);
    assert(bufferOut.byteOffset).to.equal(bufferIn.byteOffset);
  });

  Deno.test("should wrap a Uint8Array with a buffer", () => {
    const arrayIn = Uint8Array.from([1, 2, 3]);
    let bufferOut;

    assert(() => {
      bufferOut = ensureBuffer(arrayIn);
    }).to.not.throw(BSONTypeError);

    assert(bufferOut).to.be.an.instanceOf(Buffer);
    assert(bufferOut.buffer).to.equal(arrayIn.buffer);
  });

  Deno.test("should wrap a ArrayBuffer with a buffer", () => {
    const arrayBufferIn = Uint8Array.from([1, 2, 3]).buffer;
    let bufferOut;

    assert(() => {
      bufferOut = ensureBuffer(arrayBufferIn);
    }).to.not.throw(BSONTypeError);

    assert(bufferOut).to.be.an.instanceOf(Buffer);
    assert(bufferOut.buffer).to.equal(arrayBufferIn);
  });

  Deno.test("should wrap a SharedArrayBuffer with a buffer", () => {
    if (typeof SharedArrayBuffer === "undefined") {
      this.skip();
      return;
    }
    const arrayBufferIn = new SharedArrayBuffer(3);
    let bufferOut;

    assert(() => {
      bufferOut = ensureBuffer(arrayBufferIn);
    }).to.not.throw(BSONTypeError);

    assert(bufferOut).to.be.an.instanceOf(Buffer);
    assert(bufferOut.buffer).to.equal(arrayBufferIn);
  });

  Deno.test("should account for the input view byteLength and byteOffset", () => {
    const input = new Uint8Array(new Uint8Array([1, 2, 3, 4, 5]).buffer, 1, 3);
    let bufferOut;

    assert(() => {
      bufferOut = ensureBuffer(input);
    }).to.not.throw(BSONTypeError);

    assert(bufferOut).to.be.an.instanceOf(Buffer);
    assert(bufferOut.byteLength).to.equal(3);
    assert(bufferOut.byteOffset).to.equal(1);
  });

  [0, 12, -1, "", "foo", null, undefined, ["list"], {}, /x/].forEach(
    function (item) {
      Deno.test(`should throw if input is ${typeof item}: ${item}`, () => {
        assert(() => {
          ensureBuffer(item);
        }).to.throw(BSONTypeError);
      });
    },
  );

  [
    Int8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
  ].forEach(function (TypedArray) {
    Deno.test(`should throw if input is typed array ${TypedArray.name}`, () => {
      const typedArray = new TypedArray();
      assert(ensureBuffer(typedArray)).to.be.instanceOf(Buffer);
    });
  });
});
