/**
 * Recursively converts all Maps to plain objects throughout a value.
 * Mutates arrays and objects in-place to minimize allocations.
 * If no Maps exist anywhere, no allocations occur.
 *
 * @param value - The value to convert
 * @returns The value with all Maps converted to plain objects
 */
export function mapsToRecords(value: unknown): unknown {
  if (value instanceof Map) {
    // Handle Map - must allocate a new object
    const result: Record<string, unknown> = {};
    for (const [k, v] of value) {
      result[String(k)] = mapsToRecords(v);
    }
    return result;
  } else if (value !== null && typeof value === "object") {
    // Handle objects (including arrays) - mutate in place
    const obj = value as Record<string, unknown>;
    for (const k in obj) {
      obj[k] = mapsToRecords(obj[k]);
    }
    return value;
  } else {
    // Primitives - return as-is
    return value;
  }
}
