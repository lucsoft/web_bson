import { Buffer } from "buffer";
import { BSONTypeError } from "./error.ts";

// Validation regex for v4 uuid (validates with or without dashes)
const VALIDATION_REGEX =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15})$/i;

export const uuidValidateString = (str: string): boolean =>
  typeof str === "string" && VALIDATION_REGEX.test(str);

export const uuidHexStringToBuffer = (hexString: string): Uint8Array => {
  if (!uuidValidateString(hexString)) {
    throw new BSONTypeError(
      'UUID string representations must be a 32 or 36 character hex string (dashes excluded/included). Format: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" or "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".',
    );
  }

  const sanitizedHexString = hexString.replace(/-/g, "");
  return new Uint8Array(Buffer.from(sanitizedHexString, "hex").buffer);
};

export const bufferToUuidHexString = (
  bytes: Uint8Array,
  includeDashes = true,
): string => {
  const buffer = Buffer.from(bytes);
  return includeDashes
    ? buffer.toString("hex", 0, 4) +
      "-" +
      buffer.toString("hex", 4, 6) +
      "-" +
      buffer.toString("hex", 6, 8) +
      "-" +
      buffer.toString("hex", 8, 10) +
      "-" +
      buffer.toString("hex", 10, 16)
    : buffer.toString("hex");
};
