import { Code } from "../code.ts";
import {
  BSON_BINARY_SUBTYPE_DEFAULT,
  BSON_INT32_MAX,
  BSON_INT32_MIN,
  BSONData,
} from "../constants.ts";
import { DBRef, DBRefLike } from "../db_ref.ts";
import { Decimal128 } from "../decimal128.ts";
import { Double } from "../double.ts";
import { BSONError, BSONTypeError } from "../error.ts";
import { writeIEEE754 } from "../float_parser.ts";
import { Int32 } from "../int_32.ts";
import { Long } from "../long.ts";
import { MaxKey, MinKey } from "../key.ts";
import { ObjectId } from "../objectid.ts";
import { Timestamp } from "../timestamp.ts";
import { BSONRegExp } from "../regexp.ts";
import { Encoding, normalizedFunctionString, writeToBytes } from "./utils.ts";
import { Binary, BinarySizes, BSONSymbol, Document } from "../bson.ts";
/** @public */
export interface SerializeOptions {
  /** the serializer will check if keys are valid. */
  checkKeys?: boolean;
  /** serialize the javascript functions **(default:false)**. */
  serializeFunctions?: boolean;
  /** serialize will not emit undefined fields **(default:true)** */
  ignoreUndefined?: boolean;
  /** the index in the buffer where we wish to start serializing into */
  index?: number;
}

// deno-lint-ignore no-control-regex
const regexp = /\x00/;
const ignoreKeys = new Set(["$db", "$ref", "$id", "$clusterTime"]);

/*
 * isArray indicates if we are writing to a BSON array (type 0x04)
 * which forces the "key" which really an array index as a string to be written as ascii
 * This will catch any errors in index as a string generation
 */

function serializeString(
  buffer: Uint8Array,
  key: string,
  value: string,
  index: number,
  isArray?: boolean,
) {
  // Encode String type
  buffer[index++] = BSONData.STRING;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index = index + numberOfWrittenBytes + 1;
  buffer[index - 1] = 0;
  // Write the string
  const size = writeToBytes(buffer, value, index + 4, Encoding.Utf8);
  // Write the size of the string to buffer
  buffer[index + 3] = ((size + 1) >> 24) & 0xff;
  buffer[index + 2] = ((size + 1) >> 16) & 0xff;
  buffer[index + 1] = ((size + 1) >> 8) & 0xff;
  buffer[index] = (size + 1) & 0xff;
  // Update index
  index = index + 4 + size;
  // Write zero
  buffer[index++] = 0;
  return index;
}

function serializeNumber(
  buffer: Uint8Array,
  key: string,
  value: number,
  index: number,
  isArray?: boolean,
) {
  // We have an integer value
  // TODO(NODE-2529): Add support for big int
  if (
    Number.isInteger(value) &&
    value >= BSON_INT32_MIN &&
    value <= BSON_INT32_MAX
  ) {
    // If the value fits in 32 bits encode as int32
    // Set int type 32 bits or less
    buffer[index++] = BSONData.INT;
    // Number of written bytes
    const numberOfWrittenBytes = !isArray
      ? writeToBytes(buffer, key, index, Encoding.Utf8)
      : writeToBytes(buffer, key, index, Encoding.Ascii);
    // Encode the name
    index += numberOfWrittenBytes;
    buffer[index++] = 0;
    // Write the int value
    buffer[index++] = value & 0xff;
    buffer[index++] = (value >> 8) & 0xff;
    buffer[index++] = (value >> 16) & 0xff;
    buffer[index++] = (value >> 24) & 0xff;
  } else {
    // Encode as double
    buffer[index++] = BSONData.NUMBER;
    // Number of written bytes
    const numberOfWrittenBytes = !isArray
      ? writeToBytes(buffer, key, index, Encoding.Utf8)
      : writeToBytes(buffer, key, index, Encoding.Ascii);
    // Encode the name
    index += numberOfWrittenBytes;
    buffer[index++] = 0;
    // Write float
    writeIEEE754(buffer, value, index, "little", 52, 8);
    // Adjust index
    index += 8;
  }

  return index;
}

function serializeNull(
  buffer: Uint8Array,
  key: string,
  _: unknown,
  index: number,
  isArray?: boolean,
) {
  // Set long type
  buffer[index++] = BSONData.NULL;

  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);

  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  return index;
}

function serializeBoolean(
  buffer: Uint8Array,
  key: string,
  value: boolean,
  index: number,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = BSONData.BOOLEAN;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  // Encode the boolean value
  buffer[index++] = value ? 1 : 0;
  return index;
}

function serializeDate(
  buffer: Uint8Array,
  key: string,
  value: Date,
  index: number,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = BSONData.DATE;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;

  // Write the date
  const dateInMilis = Long.fromNumber(value.getTime());
  const lowBits = dateInMilis.getLowBits();
  const highBits = dateInMilis.getHighBits();
  // Encode low bits
  buffer[index++] = lowBits & 0xff;
  buffer[index++] = (lowBits >> 8) & 0xff;
  buffer[index++] = (lowBits >> 16) & 0xff;
  buffer[index++] = (lowBits >> 24) & 0xff;
  // Encode high bits
  buffer[index++] = highBits & 0xff;
  buffer[index++] = (highBits >> 8) & 0xff;
  buffer[index++] = (highBits >> 16) & 0xff;
  buffer[index++] = (highBits >> 24) & 0xff;
  return index;
}

function serializeRegExp(
  buffer: Uint8Array,
  key: string,
  value: RegExp,
  index: number,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = BSONData.REGEXP;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);

  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  if (value.source && value.source.match(regexp) != null) {
    throw Error(`value ${value.source} must not contain null bytes`);
  }
  // Adjust the index
  index += writeToBytes(buffer, value.source, index, Encoding.Utf8);
  // Write zero
  buffer[index++] = 0x00;
  // Write the parameters
  if (value.ignoreCase) buffer[index++] = 0x69; // i
  if (value.global) buffer[index++] = 0x73; // s
  if (value.multiline) buffer[index++] = 0x6d; // m

  // Add ending zero
  buffer[index++] = 0x00;
  return index;
}

function serializeBSONRegExp(
  buffer: Uint8Array,
  key: string,
  value: BSONRegExp,
  index: number,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = BSONData.REGEXP;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;

  // Check the pattern for 0 bytes
  if (value.pattern.match(regexp) != null) {
    // The BSON spec doesn't allow keys with null bytes because keys are
    // null-terminated.
    throw Error(`pattern ${value.pattern} must not contain null bytes`);
  }

  // Adjust the index
  index += writeToBytes(buffer, value.pattern, index, Encoding.Utf8);
  // Write zero
  buffer[index++] = 0x00;
  // Write the options
  index += writeToBytes(
    buffer,
    value.options.split("").sort().join(""),
    index,
    Encoding.Utf8,
  );
  // Add ending zero
  buffer[index++] = 0x00;
  return index;
}

function serializeMinMax(
  buffer: Uint8Array,
  key: string,
  value: MinKey | MaxKey,
  index: number,
  isArray?: boolean,
) {
  // Write the type of either min or max key
  if (value === null) {
    buffer[index++] = BSONData.NULL;
  } else if (value instanceof MinKey) {
    buffer[index++] = BSONData.MIN_KEY;
  } else {
    buffer[index++] = BSONData.MAX_KEY;
  }

  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  return index;
}

function serializeObjectId(
  buffer: Uint8Array,
  key: string,
  value: ObjectId,
  index: number,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = BSONData.OID;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);

  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;

  // Write the objectId into the shared buffer
  if (typeof value.id === "string") {
    writeToBytes(buffer, value.id, index, Encoding.Ascii);
  } else if (value.id instanceof Uint8Array) {
    // Use the standard JS methods here because buffer.copy() is buggy with the
    // browser polyfill
    buffer.set(value.id.subarray(0, 12), index);
  } else {
    throw new BSONTypeError(
      `object [${JSON.stringify(value)}] is not a valid ObjectId`,
    );
  }

  // Adjust index
  return index + 12;
}

function serializeBuffer(
  buffer: Uint8Array,
  key: string,
  value: Uint8Array,
  index: number,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = BSONData.BINARY;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  // Get size of the buffer (current write point)
  const size = value.length;
  // Write the size of the string to buffer
  buffer[index++] = size & 0xff;
  buffer[index++] = (size >> 8) & 0xff;
  buffer[index++] = (size >> 16) & 0xff;
  buffer[index++] = (size >> 24) & 0xff;
  // Write the default subtype
  buffer[index++] = BSON_BINARY_SUBTYPE_DEFAULT;
  // Copy the content form the binary field to the buffer
  buffer.set(value, index);
  // Adjust the index
  index += size;
  return index;
}

function serializeObject(
  buffer: Uint8Array,
  key: string,
  value: Document,
  index: number,
  checkKeys = false,
  depth = 0,
  serializeFunctions = false,
  ignoreUndefined = true,
  isArray = false,
  path: Document[] = [],
) {
  for (let i = 0; i < path.length; i++) {
    if (path[i] === value) throw new BSONError("cyclic dependency detected");
  }

  // Push value to stack
  path.push(value);
  // Write the type
  buffer[index++] = Array.isArray(value) ? BSONData.ARRAY : BSONData.OBJECT;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  const endIndex = serializeInto(
    buffer,
    value,
    checkKeys,
    index,
    depth + 1,
    serializeFunctions,
    ignoreUndefined,
    path,
  );
  // Pop stack
  path.pop();
  return endIndex;
}

function serializeDecimal128(
  buffer: Uint8Array,
  key: string,
  value: Decimal128,
  index: number,
  isArray?: boolean,
) {
  buffer[index++] = BSONData.DECIMAL128;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write the data from the value
  // Prefer the standard JS methods because their typechecking is not buggy,
  // unlike the `buffer` polyfill's.
  buffer.set(value.bytes.subarray(0, 16), index);
  return index + 16;
}

function serializeLong(
  buffer: Uint8Array,
  key: string,
  value: Long,
  index: number,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = value instanceof Timestamp
    ? BSONData.TIMESTAMP
    : BSONData.LONG;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write the date
  const lowBits = value.getLowBits();
  const highBits = value.getHighBits();
  // Encode low bits
  buffer[index++] = lowBits & 0xff;
  buffer[index++] = (lowBits >> 8) & 0xff;
  buffer[index++] = (lowBits >> 16) & 0xff;
  buffer[index++] = (lowBits >> 24) & 0xff;
  // Encode high bits
  buffer[index++] = highBits & 0xff;
  buffer[index++] = (highBits >> 8) & 0xff;
  buffer[index++] = (highBits >> 16) & 0xff;
  buffer[index++] = (highBits >> 24) & 0xff;
  return index;
}

function serializeInt32(
  buffer: Uint8Array,
  key: string,
  value: Int32 | number,
  index: number,
  isArray?: boolean,
) {
  value = value.valueOf();
  // Set int type 32 bits or less
  buffer[index++] = BSONData.INT;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write the int value
  buffer[index++] = value & 0xff;
  buffer[index++] = (value >> 8) & 0xff;
  buffer[index++] = (value >> 16) & 0xff;
  buffer[index++] = (value >> 24) & 0xff;
  return index;
}

function serializeDouble(
  buffer: Uint8Array,
  key: string,
  value: Double,
  index: number,
  isArray?: boolean,
) {
  // Encode as double
  buffer[index++] = BSONData.NUMBER;

  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);

  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;

  // Write float
  writeIEEE754(buffer, value.value, index, "little", 52, 8);

  // Adjust index
  index += 8;
  return index;
}

function serializeFunction(
  buffer: Uint8Array,
  key: string,
  // deno-lint-ignore ban-types
  value: Function,
  index: number,
  _checkKeys = false,
  _depth = 0,
  isArray?: boolean,
) {
  buffer[index++] = BSONData.CODE;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  // Function string
  const functionString = normalizedFunctionString(value);

  // Write the string
  const size = writeToBytes(buffer, functionString, index + 4, Encoding.Utf8) +
    1;
  // Write the size of the string to buffer
  buffer[index] = size & 0xff;
  buffer[index + 1] = (size >> 8) & 0xff;
  buffer[index + 2] = (size >> 16) & 0xff;
  buffer[index + 3] = (size >> 24) & 0xff;
  // Update index
  index = index + 4 + size - 1;
  // Write zero
  buffer[index++] = 0;
  return index;
}

function serializeCode(
  buffer: Uint8Array,
  key: string,
  value: Code,
  index: number,
  checkKeys = false,
  depth = 0,
  serializeFunctions = false,
  ignoreUndefined = true,
  isArray = false,
) {
  if (value.scope && typeof value.scope === "object") {
    // Write the type
    buffer[index++] = BSONData.CODE_W_SCOPE;
    // Number of written bytes
    const numberOfWrittenBytes = !isArray
      ? writeToBytes(buffer, key, index, Encoding.Utf8)
      : writeToBytes(buffer, key, index, Encoding.Ascii);
    // Encode the name
    index += numberOfWrittenBytes;
    buffer[index++] = 0;

    // Starting index
    let startIndex = index;

    // Serialize the function
    // Get the function string
    const functionString = typeof value.code === "string"
      ? value.code
      : value.code.toString();
    // Index adjustment
    index += 4;
    // Write string into buffer
    const codeSize =
      writeToBytes(buffer, functionString, index + 4, Encoding.Utf8) +
      1;
    // Write the size of the string to buffer
    buffer[index] = codeSize & 0xff;
    buffer[index + 1] = (codeSize >> 8) & 0xff;
    buffer[index + 2] = (codeSize >> 16) & 0xff;
    buffer[index + 3] = (codeSize >> 24) & 0xff;
    // Write end 0
    buffer[index + 4 + codeSize - 1] = 0;
    // Write the
    index = index + codeSize + 4;

    //
    // Serialize the scope value
    const endIndex = serializeInto(
      buffer,
      value.scope,
      checkKeys,
      index,
      depth + 1,
      serializeFunctions,
      ignoreUndefined,
    );
    index = endIndex - 1;

    // Writ the total
    const totalSize = endIndex - startIndex;

    // Write the total size of the object
    buffer[startIndex++] = totalSize & 0xff;
    buffer[startIndex++] = (totalSize >> 8) & 0xff;
    buffer[startIndex++] = (totalSize >> 16) & 0xff;
    buffer[startIndex++] = (totalSize >> 24) & 0xff;
  } else {
    buffer[index++] = BSONData.CODE;
    // Number of written bytes
    const numberOfWrittenBytes = !isArray
      ? writeToBytes(buffer, key, index, Encoding.Utf8)
      : writeToBytes(buffer, key, index, Encoding.Ascii);
    // Encode the name
    index += numberOfWrittenBytes;
    buffer[index++] = 0;
    // Function string
    const functionString = value.code.toString();
    // Write the string
    const size =
      writeToBytes(buffer, functionString, index + 4, Encoding.Utf8) + 1;
    // Write the size of the string to buffer
    buffer[index] = size & 0xff;
    buffer[index + 1] = (size >> 8) & 0xff;
    buffer[index + 2] = (size >> 16) & 0xff;
    buffer[index + 3] = (size >> 24) & 0xff;
    // Update index
    index = index + 4 + size - 1;
  }
  // Write zero
  buffer[index++] = 0;

  return index;
}

function serializeBinary(
  buffer: Uint8Array,
  key: string,
  value: Binary,
  index: number,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = BSONData.BINARY;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  // Extract the buffer
  const data = value.buffer;
  // Calculate size
  let size = value.buffer.length;
  // Add the deprecated 02 type 4 bytes of size to total
  if (value.subType === BinarySizes.SUBTYPE_BYTE_ARRAY) size += 4;
  // Write the size of the string to buffer
  buffer[index++] = size & 0xff;
  buffer[index++] = (size >> 8) & 0xff;
  buffer[index++] = (size >> 16) & 0xff;
  buffer[index++] = (size >> 24) & 0xff;
  // Write the subtype to the buffer
  buffer[index++] = value.subType;

  // If we have binary type 2 the 4 first bytes are the size
  if (value.subType === BinarySizes.SUBTYPE_BYTE_ARRAY) {
    size -= 4;
    buffer[index++] = size & 0xff;
    buffer[index++] = (size >> 8) & 0xff;
    buffer[index++] = (size >> 16) & 0xff;
    buffer[index++] = (size >> 24) & 0xff;
  }

  // Write the data to the object
  buffer.set(data, index);
  // Adjust the index
  index += size;
  return index;
}

function serializeSymbol(
  buffer: Uint8Array,
  key: string,
  value: BSONSymbol,
  index: number,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = BSONData.SYMBOL;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write the string
  const size = writeToBytes(buffer, value.value, index + 4, Encoding.Utf8) + 1;
  // Write the size of the string to buffer
  buffer[index] = size & 0xff;
  buffer[index + 1] = (size >> 8) & 0xff;
  buffer[index + 2] = (size >> 16) & 0xff;
  buffer[index + 3] = (size >> 24) & 0xff;
  // Update index
  index = index + 4 + size - 1;
  // Write zero
  buffer[index++] = 0x00;
  return index;
}

function serializeDBRef(
  buffer: Uint8Array,
  key: string,
  value: DBRef,
  index: number,
  depth: number,
  serializeFunctions: boolean,
  isArray?: boolean,
) {
  // Write the type
  buffer[index++] = BSONData.OBJECT;
  // Number of written bytes
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, Encoding.Utf8)
    : writeToBytes(buffer, key, index, Encoding.Ascii);

  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;

  let startIndex = index;
  let output: DBRefLike = {
    $ref: value.collection,
    $id: value.oid,
  };

  if (value.db != null) {
    output.$db = value.db;
  }

  output = Object.assign(output, value.fields);
  const endIndex = serializeInto(
    buffer,
    output,
    false,
    index,
    depth + 1,
    serializeFunctions,
  );

  // Calculate object size
  const size = endIndex - startIndex;
  // Write the size
  buffer[startIndex++] = size & 0xff;
  buffer[startIndex++] = (size >> 8) & 0xff;
  buffer[startIndex++] = (size >> 16) & 0xff;
  buffer[startIndex++] = (size >> 24) & 0xff;
  // Set index
  return endIndex;
}

export function serializeInto(
  buffer: Uint8Array,
  object: Document,
  checkKeys = false,
  startingIndex = 0,
  depth = 0,
  serializeFunctions = false,
  ignoreUndefined = true,
  path: Document[] = [],
): number {
  startingIndex = startingIndex || 0;
  path = path || [];

  // Push the object to the path
  path.push(object);

  // Start place to serialize into
  let index = startingIndex + 4;

  // Special case isArray
  if (Array.isArray(object)) {
    // Get object keys
    for (let i = 0; i < object.length; i++) {
      const key = i.toString();
      let value = object[i];

      // Is there an override value
      if (value?.toBSON) {
        if (typeof value.toBSON !== "function") {
          throw new BSONTypeError("toBSON is not a function");
        }
        value = value.toBSON();
      }

      if (typeof value === "string") {
        index = serializeString(buffer, key, value, index, true);
      } else if (typeof value === "number") {
        index = serializeNumber(buffer, key, value, index, true);
      } else if (typeof value === "bigint") {
        throw new BSONTypeError(
          "Unsupported type BigInt, please use Decimal128",
        );
      } else if (typeof value === "boolean") {
        index = serializeBoolean(buffer, key, value, index, true);
      } else if (value instanceof Date) {
        index = serializeDate(buffer, key, value, index, true);
      } else if (value === undefined) {
        index = serializeNull(buffer, key, value, index, true);
      } else if (value === null) {
        index = serializeNull(buffer, key, value, index, true);
      } else if (value instanceof ObjectId) {
        index = serializeObjectId(buffer, key, value, index, true);
      } else if (value instanceof Uint8Array) {
        index = serializeBuffer(buffer, key, value, index, true);
      } else if (value instanceof RegExp) {
        index = serializeRegExp(buffer, key, value, index, true);
      } else if (value instanceof Decimal128) {
        index = serializeDecimal128(buffer, key, value, index, true);
      } else if (value instanceof Long || value instanceof Timestamp) {
        index = serializeLong(buffer, key, value, index, true);
      } else if (value instanceof Double) {
        index = serializeDouble(buffer, key, value, index, true);
      } else if (typeof value === "function" && serializeFunctions) {
        index = serializeFunction(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          true,
        );
      } else if (value instanceof Code) {
        index = serializeCode(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          true,
        );
      } else if (value instanceof Binary) {
        index = serializeBinary(buffer, key, value, index, true);
      } else if (value instanceof BSONSymbol) {
        index = serializeSymbol(buffer, key, value, index, true);
      } else if (value instanceof DBRef) {
        index = serializeDBRef(
          buffer,
          key,
          value,
          index,
          depth,
          serializeFunctions,
          true,
        );
      } else if (value instanceof BSONRegExp) {
        index = serializeBSONRegExp(buffer, key, value, index, true);
      } else if (value instanceof Int32) {
        index = serializeInt32(buffer, key, value, index, true);
      } else if (value instanceof MinKey || value instanceof MaxKey) {
        index = serializeMinMax(buffer, key, value, index, true);
      } else if (value instanceof Object) {
        index = serializeObject(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          true,
          path,
        );
      } else {
        throw new BSONTypeError(`Unrecognized or invalid BSON Type: ${value}`);
      }
    }
  } else if (object instanceof Map) {
    const iterator = object.entries();
    let done = false;

    while (!done) {
      // Unpack the next entry
      const entry = iterator.next();
      done = !!entry.done;
      // Are we done, then skip and terminate
      if (done) continue;

      // Get the entry values
      const key = entry.value[0];
      const value = entry.value[1];

      // Check the type of the value
      const type = typeof value;

      // Check the key and throw error if it's illegal
      if (typeof key === "string" && !ignoreKeys.has(key)) {
        if (key.match(regexp) != null) {
          // The BSON spec doesn't allow keys with null bytes because keys are
          // null-terminated.
          throw Error(`key ${key} must not contain null bytes`);
        }

        if (checkKeys) {
          if (key.startsWith("$")) {
            throw Error(`key ${key} must not start with '$'`);
          } else if (~key.indexOf(".")) {
            throw Error(`key ${key} must not contain '.'`);
          }
        }
      }

      if (type === "string") {
        index = serializeString(buffer, key, value, index);
      } else if (type === "number") {
        index = serializeNumber(buffer, key, value, index);
      } else if (
        type === "bigint" || value instanceof BigInt64Array ||
        value instanceof BigUint64Array
      ) {
        throw new BSONTypeError(
          "Unsupported type BigInt, please use Decimal128",
        );
      } else if (type === "boolean") {
        index = serializeBoolean(buffer, key, value, index);
      } else if (value instanceof Date) {
        index = serializeDate(buffer, key, value, index);
      } else if (
        value === null || (value === undefined && ignoreUndefined === false)
      ) {
        index = serializeNull(buffer, key, value, index);
      } else if (value instanceof ObjectId) {
        index = serializeObjectId(buffer, key, value, index);
      } else if (value instanceof Uint8Array) {
        index = serializeBuffer(buffer, key, value, index);
      } else if (value instanceof RegExp) {
        index = serializeRegExp(buffer, key, value, index);
      } else if (type === "object" && value instanceof Object) {
        index = serializeObject(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          false,
          path,
        );
      } else if (type === "object" && value instanceof Decimal128) {
        index = serializeDecimal128(buffer, key, value, index);
      } else if (value instanceof Long) {
        index = serializeLong(buffer, key, value, index);
      } else if (value instanceof Double) {
        index = serializeDouble(buffer, key, value, index);
      } else if (value instanceof Code) {
        index = serializeCode(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
        );
      } else if (typeof value === "function" && serializeFunctions) {
        index = serializeFunction(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
        );
      } else if (value instanceof Binary) {
        index = serializeBinary(buffer, key, value, index);
      } else if (value instanceof BSONSymbol) {
        index = serializeSymbol(buffer, key, value, index);
      } else if (value instanceof DBRef) {
        index = serializeDBRef(
          buffer,
          key,
          value,
          index,
          depth,
          serializeFunctions,
        );
      } else if (value instanceof BSONRegExp) {
        index = serializeBSONRegExp(buffer, key, value, index);
      } else if (value instanceof Int32) {
        index = serializeInt32(buffer, key, value, index);
      } else if (value instanceof MinKey || value instanceof MaxKey) {
        index = serializeMinMax(buffer, key, value, index);
      } else {
        throw new BSONTypeError(`Unrecognized or invalid BSON TYPE: ${value}`);
      }
    }
  } else {
    // Did we provide a custom serialization method
    if (object.toBSON) {
      if (typeof object.toBSON !== "function") {
        throw new BSONTypeError("toBSON is not a function");
      }
      object = object.toBSON();
      if (object != null && typeof object !== "object") {
        throw new BSONTypeError("toBSON function did not return an object");
      }
    }

    // Iterate over all the keys
    for (const key in object) {
      let value = object[key];
      // Is there an override value
      if (value?.toBSON) {
        if (typeof value.toBSON !== "function") {
          throw new BSONTypeError("toBSON is not a function");
        }
        value = value.toBSON();
      }

      // Check the type of the value
      const type = typeof value;

      // Check the key and throw error if it's illegal
      if (typeof key === "string" && !ignoreKeys.has(key)) {
        if (key.match(regexp) != null) {
          // The BSON spec doesn't allow keys with null bytes because keys are
          // null-terminated.
          throw Error(`key ${key} must not contain null bytes`);
        }

        if (checkKeys) {
          if (key.startsWith("$")) {
            throw Error(`key ${key} must not start with '$'`);
          } else if (~key.indexOf(".")) {
            throw Error(`key ${key} must not contain '.'`);
          }
        }
      }

      if (type === "string") {
        index = serializeString(buffer, key, value, index);
      } else if (type === "number") {
        index = serializeNumber(buffer, key, value, index);
      } else if (type === "bigint") {
        throw new BSONTypeError(
          "Unsupported type BigInt, please use Decimal128",
        );
      } else if (type === "boolean") {
        index = serializeBoolean(buffer, key, value, index);
      } else if (value instanceof Date) {
        index = serializeDate(buffer, key, value, index);
      } else if (value === undefined) {
        if (ignoreUndefined === false) {
          index = serializeNull(buffer, key, value, index);
        }
      } else if (value === null) {
        index = serializeNull(buffer, key, value, index);
      } else if (value instanceof ObjectId) {
        index = serializeObjectId(buffer, key, value, index);
      } else if (value instanceof Uint8Array) {
        index = serializeBuffer(buffer, key, value, index);
      } else if (value instanceof RegExp) {
        index = serializeRegExp(buffer, key, value, index);
      } else if (type === "object" && value instanceof Decimal128) {
        index = serializeDecimal128(buffer, key, value, index);
      } else if (value instanceof Long || value instanceof Timestamp) {
        index = serializeLong(buffer, key, value, index);
      } else if (value instanceof Double) {
        index = serializeDouble(buffer, key, value, index);
      } else if (value instanceof Code) {
        index = serializeCode(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
        );
      } else if (typeof value === "function" && serializeFunctions) {
        index = serializeFunction(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
        );
      } else if (value instanceof Binary) {
        index = serializeBinary(buffer, key, value, index);
      } else if (value instanceof BSONSymbol) {
        index = serializeSymbol(buffer, key, value, index);
      } else if (value instanceof DBRef) {
        index = serializeDBRef(
          buffer,
          key,
          value,
          index,
          depth,
          serializeFunctions,
        );
      } else if (value instanceof BSONRegExp) {
        index = serializeBSONRegExp(buffer, key, value, index);
      } else if (value instanceof Int32) {
        index = serializeInt32(buffer, key, value, index);
      } else if (value instanceof MinKey || value instanceof MaxKey) {
        index = serializeMinMax(buffer, key, value, index);
      } else if (value instanceof Object) {
        index = serializeObject(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          false,
          path,
        );
      } else {
        throw new BSONTypeError(`Unrecognized or invalid BSON Type: ${value}`);
      }
    }
  }

  // Remove the path
  path.pop();

  // Final padding byte for object
  buffer[index++] = 0x00;

  // Final size
  const size = index - startingIndex;
  // Write the size of the object
  buffer[startingIndex++] = size & 0xff;
  buffer[startingIndex++] = (size >> 8) & 0xff;
  buffer[startingIndex++] = (size >> 16) & 0xff;
  buffer[startingIndex++] = (size >> 24) & 0xff;
  return index;
}
