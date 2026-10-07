type FieldBlockConfig = Record<string, unknown> & { blockType: string; name?: string }

/**
 * Expands `global_field_ref` blocks into the concrete block they reference from
 * `globalCustomFields`, preserving position/order. A dangling reference (name not
 * found) is skipped with a logged warning, not thrown — this runs at instance
 * creation and live blueprint re-sync time, where a hard throw would break
 * workflow advancement rather than just omitting one optional field.
 */
export function resolveFieldBlocks(
  blocks: FieldBlockConfig[] | null | undefined,
  globalCustomFields: FieldBlockConfig[] | null | undefined,
): FieldBlockConfig[] {
  const globals = globalCustomFields || []
  const result: FieldBlockConfig[] = []
  for (const block of blocks || []) {
    if (block.blockType === 'global_field_ref') {
      const refName = (block as { global_field_name?: string }).global_field_name
      const resolved = globals.find((g) => g.name === refName)
      if (resolved) {
        result.push(resolved)
      } else {
        console.warn(
          `[resolveFieldBlocks] dangling global_field_ref: "${refName}" not found in global_custom_fields`,
        )
      }
      continue
    }
    result.push(block)
  }
  return result
}
