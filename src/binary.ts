import { UUID } from "./uuid.ts";
import { BSONError } from "./error.ts";
import { b64 } from "../deps.ts";

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

const textDecoder = new TextDecoder();

export class Binary {
  buffer!: Uint8Array;
  subType!: number;

  constructor(
    buffer: Uint8Array,
    subType: number = BinarySizes.BSON_BINARY_SUBTYPE_DEFAULT,
  ) {
    this.buffer = buffer;
    this.subType = subType;
  }

  length(): number {
    return this.buffer.length;
  }

  toJSON(): string {
    return b64.encode(this.buffer);
  }

  toString(): string {
    return textDecoder.decode(this.buffer);
  }

  toUUID(): UUID {
    if (this.subType === BinarySizes.SUBTYPE_UUID) {
      return new UUID(this.buffer);
    }

    throw new BSONError(
      `Binary sub_type "${this.subType}" is not supported for converting to UUID. Only "${BinarySizes.SUBTYPE_UUID}" is currently supported.`,
    );
  }

  [Symbol.for("Deno.customInspect")](): string {
    if (this.subType === BinarySizes.SUBTYPE_DEFAULT) {
      return `new Binary(${Deno.inspect(this.buffer)})`;
    }

    return `new Binary(${Deno.inspect(this.buffer)}, ${this.subType})`;
  }
}
