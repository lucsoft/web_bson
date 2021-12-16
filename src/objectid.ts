import { decodeHexString, encodeHexString } from "../utils.ts";
import { BSONTypeError } from "./error.ts";
import { randomBytes } from "./parser/utils.ts";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Regular expression that checks for hex value
const checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

// Unique sequence for the current process (initialized on first use)
let PROCESS_UNIQUE: Uint8Array | null = null;
/**
 * A class representation of the BSON ObjectId type.
 * @public
 */
export class ObjectId {
  static #index = Math.floor(Math.random() * 0xff_ff_ff);
  static cacheHexString: boolean;

  /** ObjectId hexString cache @internal */
  #id?: string;
  #bytesBuffer: Uint8Array;
  /**
   * Create an ObjectId type
   *
   * @param inputId - Can be a 24 character hex string, 12 byte binary Buffer, or a number.
   */
  constructor(
    inputId: string | number | ObjectId | Uint8Array = ObjectId
      .generate(),
  ) {
    // workingId is set based on type of input and whether valid id exists for the input
    let workingId: Uint8Array | string | number;
    if (typeof inputId === "object" && inputId && "id" in inputId) {
      if (typeof inputId.id !== "string" && !ArrayBuffer.isView(inputId.id)) {
        throw new BSONTypeError(
          "Argument passed in must have an id that is of type string or Buffer",
        );
      }
      workingId =
        "toHexString" in inputId && typeof inputId.toHexString === "function"
          ? decodeHexString(inputId.toHexString())
          : inputId.id;
    } else {
      workingId = inputId;
    }

    // the following cases use workingId to construct an ObjectId
    if (workingId == null || typeof workingId === "number") {
      // The most common use case (blank id, new objectId instance)
      // Generate a new id
      this.#bytesBuffer = new Uint8Array(ObjectId.generate(
        typeof workingId === "number" ? workingId : undefined,
      ));
    } else if (ArrayBuffer.isView(workingId) && workingId.byteLength === 12) {
      this.#bytesBuffer = workingId;
    } else if (typeof workingId === "string") {
      if (workingId.length === 12) {
        const bytes = textEncoder.encode(workingId);
        if (bytes.byteLength === 12) {
          this.#bytesBuffer = bytes;
        } else {
          throw new BSONTypeError(
            "Argument passed in must be a string of 12 bytes",
          );
        }
      } else if (workingId.length === 24 && checkForHexRegExp.test(workingId)) {
        this.#bytesBuffer = decodeHexString(workingId);
      } else {
        throw new BSONTypeError(
          "Argument passed in must be a string of 12 bytes or a string of 24 hex characters",
        );
      }
    } else {
      throw new BSONTypeError(
        "Argument passed in does not match the accepted types",
      );
    }
    // If we are caching the hex string
    if (ObjectId.cacheHexString) {
      this.#id = encodeHexString(this.id);
    }
  }

  /**
   * The ObjectId bytes
   * @readonly
   */
  get id(): Uint8Array {
    return this.#bytesBuffer;
  }

  set id(value: Uint8Array) {
    this.#bytesBuffer = value;
    if (ObjectId.cacheHexString) {
      this.#id = encodeHexString(value);
    }
  }

  /** Returns the ObjectId id as a 24 character hex string representation */
  toHexString(): string {
    if (ObjectId.cacheHexString && this.#id) {
      return this.#id;
    }

    const hexString = encodeHexString(this.id);

    if (ObjectId.cacheHexString && !this.#id) {
      this.#id = hexString;
    }

    return hexString;
  }

  /**
   * Generate a 12 byte id buffer used in ObjectId's
   *
   * @param time - pass in a second based timestamp.
   */
  static generate(time?: number): Uint8Array {
    if ("number" !== typeof time) {
      time = Math.floor(Date.now() / 1000);
    }

    const inc = (this.#index = (this.#index + 1) % 0xff_ff_ff);
    const objectId = new Uint8Array(12);

    // 4-byte timestamp
    new DataView(objectId.buffer, 0, 4).setUint32(0, time);

    // set PROCESS_UNIQUE if yet not initialized
    if (PROCESS_UNIQUE === null) {
      PROCESS_UNIQUE = randomBytes(5);
    }

    // 5-byte process unique
    objectId[4] = PROCESS_UNIQUE[0];
    objectId[5] = PROCESS_UNIQUE[1];
    objectId[6] = PROCESS_UNIQUE[2];
    objectId[7] = PROCESS_UNIQUE[3];
    objectId[8] = PROCESS_UNIQUE[4];

    // 3-byte counter
    objectId[11] = inc & 0xff;
    objectId[10] = (inc >> 8) & 0xff;
    objectId[9] = (inc >> 16) & 0xff;

    return objectId;
  }

  /**
   * Converts the id into a 24 character hex string for printing
   */
  toString(): string {
    return this.toHexString();
  }

  /** Converts to its JSON the 24 character hex string representation. */
  toJSON(): string {
    return this.toHexString();
  }

  /**
   * Compares the equality of this ObjectId with `otherID`.
   *
   * @param otherId - ObjectId instance to compare against.
   */
  equals(otherId: string | ObjectId): boolean {
    if (otherId == null) {
      return false;
    }

    if (otherId instanceof ObjectId) {
      return this.toString() === otherId.toString();
    }

    if (
      typeof otherId === "string" &&
      ObjectId.isValid(otherId) &&
      otherId.length === 12 &&
      this.id instanceof Uint8Array
    ) {
      // return otherId === Buffer.prototype.toString.call(this.id, "latin1");
      return otherId === textDecoder.decode(this.id);
    }

    if (
      typeof otherId === "string" && ObjectId.isValid(otherId) &&
      otherId.length === 24
    ) {
      return otherId.toLowerCase() === this.toHexString();
    }

    if (
      typeof otherId === "string" && ObjectId.isValid(otherId) &&
      otherId.length === 12
    ) {
      const otherIdUint8Array = textEncoder.encode(otherId);
      // compare two Uint8arrays
      for (let i = 0; i < 12; i++) {
        if (otherIdUint8Array[i] !== this.id[i]) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /** Returns the generation date (accurate up to the second) that this ID was generated. */
  getTimestamp(): Date {
    const timestamp = new Date();
    const time = new DataView(this.id.buffer, 0, 4).getUint32(0);
    timestamp.setTime(Math.floor(time) * 1000);
    return timestamp;
  }

  /**
   * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
   *
   * @param time - an integer number representing a number of seconds.
   */
  static createFromTime(time: number): ObjectId {
    const buffer = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    // Encode time into first 4 bytes
    new DataView(buffer.buffer, 0, 4).setUint32(0, time);
    // Return the new objectId
    return new ObjectId(buffer);
  }

  /**
   * Creates an ObjectId from a hex string representation of an ObjectId.
   *
   * @param hexString - create a ObjectId from a passed in 24 character hexstring.
   */
  static createFromHexString(hexString: string): ObjectId {
    // Throw an error if it's not a valid setup
    if (
      typeof hexString === "undefined" ||
      (hexString != null && hexString.length !== 24)
    ) {
      throw new BSONTypeError(
        "Argument passed in must be a single String of 12 bytes or a string of 24 hex characters",
      );
    }

    return new ObjectId(decodeHexString(hexString));
  }

  /**
   * Checks if a value is a valid bson ObjectId
   *
   * @param id - ObjectId instance to validate.
   */
  static isValid(
    id: string | number | ObjectId | Uint8Array,
  ): boolean {
    if (id == null) return false;

    try {
      new ObjectId(id);
      return true;
    } catch {
      return false;
    }
  }

  [Symbol.for("Deno.customInspect")](): string {
    return `new ObjectId("${this.toHexString()}")`;
  }
}
