/**
 * A class representation of the BSON Double type.
 * @public
 */
export class Double {
  value!: number;

  /**
   * Create a Double type
   *
   * @param value - the number we want to represent as a double.
   */
  constructor(value: number) {
    if ((value as unknown) instanceof Number) {
      value = value.valueOf();
    }

    this.value = +value;
  }

  /**
   * Access the number value.
   *
   * @returns returns the wrapped double number.
   */
  valueOf(): number {
    return this.value;
  }

  toJSON(): number {
    return this.value;
  }

  toString(radix?: number): string {
    return this.value.toString(radix);
  }

  [Symbol.for("Deno.customInspect")](): string {
    return `new Double(${this.toJSON()})`;
  }
}
