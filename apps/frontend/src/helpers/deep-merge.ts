// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: unknown): item is object {
  return typeof item === "object" && item !== null && !Array.isArray(item);
}

/**
 * Deep merge two objects with proper value replacement.
 * @param target
 * @param source
 */
export default function deepMerge<T, R>(target: T, source: R): T & R {
  const output = { ...target } as any;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = (source as any)[key];
      const targetValue = (target as any)[key];

      // If source value is an object and target value is also an object, merge recursively
      if (isObject(sourceValue) && isObject(targetValue)) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        // Otherwise, source value completely replaces target value
        output[key] = sourceValue;
      }
    });
  }

  return output;
}
