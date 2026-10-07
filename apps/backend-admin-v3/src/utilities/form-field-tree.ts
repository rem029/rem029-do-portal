export type FormFieldContainer = 'top' | 'multi-step' | 'conditional' | 'group' | 'list'

export interface FormFieldTreeNode {
  block: Record<string, unknown>
  path: string
  container: FormFieldContainer
  /** The multi-step step this block sits in, if any (label is the raw, possibly localized value). */
  step?: { index: number; label: unknown }
}

/**
 * Recursively walks form fields (top level, multi-step steps, conditional, group, list)
 * and yields each block with its dotted name path and container context.
 */
export function* walkFormFieldTree(
  fieldsList: unknown[],
  currentPath = '',
  container: FormFieldContainer = 'top',
  step?: FormFieldTreeNode['step'],
): Generator<FormFieldTreeNode> {
  if (!Array.isArray(fieldsList)) return

  for (const item of fieldsList) {
    if (!item || typeof item !== 'object') continue
    const block = item as Record<string, unknown>

    const name = typeof block.name === 'string' ? block.name : ''
    const blockPath = currentPath
      ? name
        ? `${currentPath}.${name}`
        : currentPath
      : name

    yield {
      block,
      path: blockPath,
      container,
      step,
    }

    if (block.blockType === 'multi-step' && Array.isArray(block.steps)) {
      for (const [index, stepItem] of (block.steps as unknown[]).entries()) {
        const stepObj = stepItem as { fields?: unknown[]; label?: unknown } | null
        if (stepObj && typeof stepObj === 'object' && Array.isArray(stepObj.fields)) {
          yield* walkFormFieldTree(stepObj.fields, currentPath, 'multi-step', {
            index,
            label: stepObj.label,
          })
        }
      }
    } else if (block.blockType === 'conditional' && Array.isArray(block.fields)) {
      yield* walkFormFieldTree(block.fields as unknown[], currentPath, 'conditional', step)
    } else if (block.blockType === 'group' && Array.isArray(block.fields)) {
      yield* walkFormFieldTree(block.fields as unknown[], blockPath, 'group', step)
    } else if (block.blockType === 'list' && Array.isArray(block.fields)) {
      yield* walkFormFieldTree(block.fields as unknown[], blockPath, 'list', step)
    }
  }
}
