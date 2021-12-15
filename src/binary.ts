import { UUID } from "./uuid.ts";
import { BSONError, BSONTypeError } from "./error.ts";
import { Buffer } from "buffer";
import { concat, copy } from "https://deno.land/std@0.117.0/bytes/mod.ts";

export type BinarySequence = Uint8Array | number[];

export const enum BinarySizes {
  BUFFER_SIZE = 256,
  SUBTYPE_DEFAULT = 0,
  SUBTYPE_FUNCTION = 1,
  SUBTYPE_BYTE_ARRAY = 2,
  SUBTYPE_UUID = 4,
  SUBTYPE_MD5 = 5,
  SUBTYPE_ENCRYPTED = 6,
  SUBTYPE_COLUMN = 7,
  SUBTYPE_USER_DEFINE = 128,
  BSON_BINARY_SUBTYPE_DEFAULT = 0,
}

/**
 * A class representation of the BSON Binary type.
 * @public
 */
export class Binary {
  buffer!: Uint8Array;
  sub_type!: number;
  position!: number;

  /**
   * @param buffer - a buffer object containing the binary data.
   * @param subType - the option binary type.
   */
  constructor(
    buffer?: string | BinarySequence,
    subType: number = BinarySizes.BSON_BINARY_SUBTYPE_DEFAULT,
  ) {
    if (
      buffer != null &&
      typeof buffer !== "string" &&
      !(buffer instanceof Uint8Array) &&
      !Array.isArray(buffer)
    ) {
      throw new BSONTypeError(
        "Binary can only be constructed from string, Uint8Array, or Array<number>",
      );
    }

    if (buffer == null) {
      // create an empty binary buffer
      this.buffer = new Uint8Array(BinarySizes.BUFFER_SIZE);
      this.position = 0;
    } else {
      if (typeof buffer === "string") {
        // string
        this.buffer = Buffer.from(buffer, "binary");
      } else if (Array.isArray(buffer)) {
        // number[]
        this.buffer = Buffer.from(buffer);
      } else {
        // Buffer | TypedArray | ArrayBuffer
        this.buffer = buffer;
      }

      this.position = this.buffer.byteLength;
      this.sub_type = subType;
    }
  }

  /**
   * Updates this binary with byte_value.
   *
   * @param byteValue - a single byte we wish to write.
   */
  put(byteValue: string | number | Uint8Array | Buffer | number[]): void {
    // If it's a string and a has more than one character throw an error
    if (typeof byteValue === "string" && byteValue.length !== 1) {
      throw new BSONTypeError("only accepts single character String");
    } else if (typeof byteValue !== "number" && byteValue.length !== 1) {
      throw new BSONTypeError(
        "only accepts single character Uint8Array or Array",
      );
    }

    // Decode the byte value once
    let decodedByte: number;
    if (typeof byteValue === "string") {
      decodedByte = byteValue.charCodeAt(0);
    } else if (typeof byteValue === "number") {
      decodedByte = byteValue;
    } else {
      decodedByte = byteValue[0];
    }

    if (decodedByte < 0 || decodedByte > 255) {
      throw new BSONTypeError(
        "only accepts number in a valid unsigned byte range 0-255",
      );
    }

    if (!(this.buffer.length > this.position)) {
      const buffer = Buffer.alloc(BinarySizes.BUFFER_SIZE + this.buffer.length);
      // Combine the two buffers together
      this.buffer = concat(new Uint8Array(buffer.buffer), this.buffer);
    }
    this.buffer[this.position++] = decodedByte;
  }

  /**
   * Writes a buffer or string to the binary.
   *
   * @param sequence - a string or buffer to be written to the Binary BSON object.
   * @param offset - specify the binary of where to write the content.
   */
  write(sequence: string | BinarySequence, offset: number): void {
    offset = typeof offset === "number" ? offset : this.position;

    // If the buffer is to small let's extend the buffer
    if (this.buffer.length < offset + sequence.length) {
      const buffer = new Uint8Array(this.buffer.length + sequence.length);
      copy(this.buffer, buffer);
      // Assign the new buffer
      this.buffer = buffer;
    }

    if (ArrayBuffer.isView(sequence)) {
      this.buffer.set(sequence, offset);
      this.position = offset + sequence.byteLength > this.position
        ? offset + sequence.length
        : this.position;
    } else if (typeof sequence === "string") {
      Buffer.from(this.buffer).write(
        sequence,
        offset,
        sequence.length,
        "binary",
      );
      this.position = offset + sequence.length > this.position
        ? offset + sequence.length
        : this.position;
    }
  }

  /**
   * Reads **length** bytes starting at **position**.
   *
   * @param position - read from the given position in the Binary.
   * @param length - the number of bytes to read.
   */
  read(position: number, length: number): BinarySequence {
    length = length && length > 0 ? length : this.position;

    // Let's return the data based on the type we have
    return this.buffer.slice(position, position + length);
  }

  /**
   * Returns the value of this binary as a string.
   * @param asRaw - Will skip converting to a string
   * @remarks
   * This is handy when calling this function conditionally for some key value pairs and not others
   */
  value(asRaw?: boolean): string | BinarySequence {
    asRaw = !!asRaw;

    // Optimize to serialize for the situation where the data == size of buffer
    if (asRaw && this.buffer.length === this.position) {
      return this.buffer;
    }

    // If it's a node.js buffer object
    if (asRaw) {
      return this.buffer.slice(0, this.position);
    }
    return Buffer.from(this.buffer).toString("binary", 0, this.position);
  }

  /** the length of the binary sequence */
  length(): number {
    return this.position;
  }

  toJSON(): string {
    return Buffer.from(this.buffer).toString("base64");
  }

  toString(format?: string): string {
    return Buffer.from(this.buffer).toString(format);
  }

  toUUID(): UUID {
    if (this.sub_type === BinarySizes.SUBTYPE_UUID) {
      return new UUID(this.buffer.slice(0, this.position));
    }

    throw new BSONError(
      `Binary sub_type "${this.sub_type}" is not supported for converting to UUID. Only "${BinarySizes.SUBTYPE_UUID}" is currently supported.`,
    );
  }

  [Symbol.for("Deno.customInspect")](): string {
    const asBuffer = this.value(true);
    return `new Binary(Buffer.from("${
      Buffer.from(asBuffer).toString("hex")
    }", "hex"), ${this.sub_type})`;
  }
}
