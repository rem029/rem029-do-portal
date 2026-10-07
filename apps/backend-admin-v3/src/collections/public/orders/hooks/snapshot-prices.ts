import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'
import type { MenuItem } from '@/payload-types'

type IncomingModifierSelection = { group_name?: string; selections?: string[] }

/**
 * Snapshots each order item's price and chosen modifier option labels from menu-items
 * at the time it's first added, so later menu edits (price or modifier changes) never
 * retroactively alter historical orders. Also re-derives selected_modifiers strictly
 * from the menu item's current modifier_groups/options (dropping anything that doesn't
 * match a known group/label) and rejects the write if a required group has no valid
 * selection - guest actions run with overrideAccess, so this hook is the only
 * server-side gate on that.
 */
export const snapshotOrderItemPrices: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!Array.isArray(data?.items)) return data

  for (const row of data.items) {
    if (row?.price_at_order == null && row?.item) {
      const itemId = typeof row.item === 'object' ? row.item.id : row.item
      let menuItem: MenuItem | undefined
      try {
        menuItem = await req.payload.findByID({
          collection: 'menu-items',
          id: itemId,
          depth: 0,
          req,
          overrideAccess: true,
        })
        row.price_at_order = menuItem?.price ?? 0
      } catch {
        row.price_at_order = 0
      }

      const modifierGroups = menuItem?.modifier_groups || []
      const incoming: IncomingModifierSelection[] = Array.isArray(row.selected_modifiers)
        ? row.selected_modifiers
        : []

      const resolvedModifiers: { group_name: string; selections: string[] }[] = []

      for (const group of modifierGroups) {
        const match = incoming.find((s) => s?.group_name === group.name)
        const validLabels = new Set((group.options || []).map((o) => o.label))
        let chosen = (match?.selections || []).filter((label) => validLabels.has(label))

        if (group.input_type === 'radio' && chosen.length > 1) {
          chosen = chosen.slice(0, 1)
        }

        if (group.required && chosen.length === 0) {
          throw new APIError(
            `"${group.name}" is required for ${menuItem?.title || 'this item'}`,
            400,
          )
        }

        if (chosen.length > 0) {
          resolvedModifiers.push({ group_name: group.name, selections: chosen })
        }
      }

      row.selected_modifiers = resolvedModifiers
    }
  }

  return data
}
