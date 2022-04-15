import { UUID, UUIDExtended } from "./uuid.ts";
import { BSONError, BSONTypeError } from "./error.ts";
import { b64 } from "../deps.ts";
import { EJSONOptions } from "./extended_json.ts";
import { uuidHexStringToBuffer } from "./uuid_utils.ts";

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

export interface BinaryExtended {
  $binary: {
    subType: string;
    base64: string;
  };
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

  toExtendedJSON(options?: EJSONOptions): BinaryExtended {
    options = options || {};
    const base64String = b64.encode(this.buffer);

    const subType = Number(this.subType).toString(16);
    return {
      $binary: {
        base64: base64String,
        subType: subType.length === 1 ? "0" + subType : subType,
      },
    };
  }

  static fromExtendedJSON(
    doc: BinaryExtended | UUIDExtended,
    options?: EJSONOptions,
  ): Binary {
    options = options || {};
    let data: Uint8Array | undefined;
    let type;
    if ("$binary" in doc) {
      if (typeof doc.$binary !== "string") {
        type = doc.$binary.subType ? parseInt(doc.$binary.subType, 16) : 0;
        data = b64.decode(doc.$binary.base64);
      }
    } else if ("$uuid" in doc) {
      type = 4;
      data = uuidHexStringToBuffer(doc.$uuid);
    }
    if (!data) {
      throw new BSONTypeError(
        `Unexpected Binary Extended JSON format ${JSON.stringify(doc)}`,
      );
    }
    return new Binary(data, type);
  }

  [Symbol.for("Deno.customInspect")](): string {
    if (this.subType === BinarySizes.SUBTYPE_DEFAULT) {
      return `new Binary(${Deno.inspect(this.buffer)})`;
    }

    return `new Binary(${Deno.inspect(this.buffer)}, ${this.subType})`;
  }
}
