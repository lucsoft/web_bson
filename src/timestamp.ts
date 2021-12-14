import { Long } from "./long.ts";
import { isObjectLike } from "./parser/utils.ts";

/** @public */
export type LongWithoutOverrides = new (
  low: unknown,
  high?: number,
  unsigned?: boolean,
) => {
  [P in keyof Long]: Long[P];
};
/** @public */
export const LongWithoutOverridesClass =
  Long as unknown as LongWithoutOverrides;

/** @public */
export class Timestamp extends LongWithoutOverridesClass {
  static readonly MAX_VALUE = Long.MAX_UNSIGNED_VALUE;

  constructor(
    low: number | Long,
    high?: number,
    unsigned: boolean = true,
  ) {
    super(
      Long.isLong(low) ? low.low : high,
      Long.isLong(low) ? low.high : high,
      unsigned,
    );
  }

  toJSON(): { $timestamp: string } {
    return {
      $timestamp: this.toString(),
    };
  }

  /** Returns a Timestamp represented by the given (32-bit) integer value. */
  static fromInt(value: number): Timestamp {
    return new Timestamp(Long.fromInt(value, true));
  }

  /** Returns a Timestamp representing the given number value, provided that it is a finite number. Otherwise, zero is returned. */
  static fromNumber(value: number): Timestamp {
    return new Timestamp(Long.fromNumber(value, true));
  }

  /**
   * Returns a Timestamp for the given high and low bits. Each is assumed to use 32 bits.
   *
   * @param lowBits - the low 32-bits.
   * @param highBits - the high 32-bits.
   */
  static fromBits(lowBits: number, highBits: number): Timestamp {
    return new Timestamp(new Long(lowBits, highBits));
  }

  /**
   * Returns a Timestamp from the given string, optionally using the given radix.
   *
   * @param str - the textual representation of the Timestamp.
   * @param optRadix - the radix in which the text is written.
   */
  static fromString(str: string, optRadix: number): Timestamp {
    return new Timestamp(Long.fromString(str, true, optRadix));
  }

  [Symbol.for("Deno.customInspect")](): string {
    return `Timestamp(low: ${this.getHighBits()}, high: ${this.getLowBits()})`;
  }
}
