import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Mirrors `info.title` onto a hidden top-level `title` field so it can be used
 * as `admin.useAsTitle` — Payload rejects a nested (dotted) `useAsTitle` path,
 * so `info.title` itself can't be used directly. Falls back to `info.slug` /
 * `operator_slug` when no title has been entered yet, matching the fallback
 * pattern already used elsewhere for event display names (e.g.
 * `fnb-event-staff/components/actions.ts`'s `event.info?.title || event.info?.slug`).
 */
export const syncEventDisplayTitle: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  // Structural cast: `data`/`originalDoc` are typed generically by the hook
  // signature; both actually carry `fnb-menu-events`' `info`/`operator_slug` shape.
  const incoming = data as { info?: { title?: string; slug?: string }; operator_slug?: string }
  const original = originalDoc as
    | { info?: { title?: string; slug?: string }; operator_slug?: string }
    | undefined

  const title =
    incoming.info?.title ??
    original?.info?.title ??
    incoming.info?.slug ??
    original?.info?.slug ??
    incoming.operator_slug ??
    original?.operator_slug

  if (title) {
    ;(data as { title?: string }).title = title
  }

  return data
}
