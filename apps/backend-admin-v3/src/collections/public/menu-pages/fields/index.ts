import type { Field, Where } from 'payload'
import type { User } from '@/payload-types'

type FieldTypes =
  | 'label'
  | 'js'
  | 'css'
  | 'className'
  | 'html'
  | 'link'
  | 'variant'
  | 'image'
  | 'title'
  | 'slug'
  | 'description'
  | 'size'
  | 'element'
  | 'price'
  | 'category'
  | 'allergen'
  | 'tags'
  | 'availability_period'
  | 'colors'
  | 'is_sticky'
  | 'top_pos'

const fieldsMap: Record<FieldTypes, Field> = {
  className: {
    type: 'text',
    name: 'className',
    label: 'Class Name',
    localized: true,
  },
  css: {
    type: 'code',
    name: 'css',
    label: 'CSS',
    localized: true,
    admin: { language: 'css' },
  },
  html: {
    type: 'code',
    name: 'html',
    label: 'HTML',
    localized: true,
    admin: { language: 'html' },
  },
  js: {
    type: 'code',
    name: 'js',
    label: 'JavaScript',
    localized: true,
    admin: { language: 'javascript', hidden: true },
  },
  label: { type: 'text', name: 'label', label: 'Label', localized: true },
  link: { type: 'text', name: 'link', label: 'Link', localized: true },
  image: {
    type: 'upload',
    name: 'image',
    label: 'Image',
    relationTo: 'media',
    localized: true,
  },
  title: { type: 'text', name: 'title', label: 'Title', localized: true },
  description: {
    type: 'textarea',
    name: 'description',
    label: 'Description',
    localized: true,
  },
  price: { type: 'number', label: 'Price', name: 'price' },
  slug: {
    type: 'text',
    name: 'slug',
    label: 'Slug',
    unique: true,
    required: true,
  },
  size: {
    type: 'select',
    name: 'size',
    label: 'Size',
    localized: true,
    options: [
      { label: 'XX Large', value: '2xl' },
      { label: 'X Large', value: 'xl' },
      { label: 'Large', value: 'lg' },
      { label: 'Medium', value: 'md' },
      { label: 'Small', value: 'sm' },
      { label: 'Extra Small', value: 'xs' },
      { label: 'Tiny', value: '2xs' },
    ],
  },
  variant: {
    type: 'select',
    name: 'variant',
    label: 'Variant',
    localized: true,
    options: [
      { label: 'Primary', value: 'primary' },
      { label: 'Primary Contrast', value: 'primary-contrast' },
      { label: 'Background', value: 'background' },
      { label: 'Background Card', value: 'background-card' },
      { label: 'Neutral', value: 'neutral' },
      { label: 'Text', value: 'text' },
    ],
  },
  element: {
    type: 'select',
    name: 'element',
    label: 'Element',
    localized: true,
    options: [
      { label: 'H1', value: 'h1' },
      { label: 'H2', value: 'h2' },
      { label: 'H3', value: 'h3' },
      { label: 'H4', value: 'h4' },
      { label: 'H5', value: 'h5' },
      { label: 'H6', value: 'h6' },
      { label: 'Paragraph', value: 'paragraph' },
    ],
  },
  category: {
    name: 'category',
    label: 'Category',
    type: 'relationship',
    relationTo: 'menu-categories',
    hasMany: true,
  },
  allergen: {
    name: 'allergen',
    label: 'Allergen',
    type: 'relationship',
    relationTo: 'menu-allergens',
    hasMany: true,
  },
  tags: {
    name: 'tags',
    label: 'Tags',
    type: 'relationship',
    relationTo: 'menu-tags',
    hasMany: true,
  },
  availability_period: {
    name: 'availability_period',
    label: 'Availability Period',
    type: 'select',
    hasMany: true,
    defaultValue: ['all_day'],
    options: [
      { label: 'Breakfast', value: 'breakfast' },
      { label: 'Lunch', value: 'lunch' },
      { label: 'Dinner', value: 'dinner' },
      { label: 'All Day', value: 'all_day' },
    ],
  },
  is_sticky: {
    type: 'checkbox',
    name: 'is_sticky',
    label: 'Is Sticky?',
    defaultValue: false,
  },
  top_pos: {
    type: 'number',
    name: 'top_pos',
    label: 'Top Position',
    defaultValue: 0,
  },
  colors: {
    type: 'text',
    name: 'colors',
    label: 'Color',
    localized: true,
    admin: {
      components: {
        Field: '@/common/components/color-picker',
      },
    },
  },
}

/**
 * Deep merge utility for field overrides.
 */
const deepMerge = <T extends object>(target: T, source?: Partial<T>): T => {
  if (!source) return target
  const output = { ...target } as any
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceVal = (source as any)[key]
      const targetVal = (target as any)[key]
      if (
        sourceVal &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        output[key] = deepMerge(targetVal, sourceVal)
      } else {
        output[key] = sourceVal
      }
    }
  }
  return output
}

/**
 * Builds an array of Payload 3 Field objects from a list of field type + override pairs.
 */
const getFields = (fields: { type: FieldTypes; override?: Partial<Field> }[]): Field[] => {
  const _fields: Field[] = []

  for (const { type, override } of fields) {
    const foundField = fieldsMap[type]
    const field = deepMerge(foundField, override)
    _fields.push(field)
  }

  return _fields
}

/**
 * Creates an operator relationship field.
 */
export const getOperatorField = (): Field => ({
  type: 'relationship',
  name: 'operator',
  label: 'Operator',
  required: true,
  relationTo: 'operators',
  defaultValue: ({ user }: { user: any }) => {
    const operator = user?.operator
    if (operator) {
      return typeof operator === 'object' ? operator.id : operator
    }
    return undefined
  },
  filterOptions: ({ user }) => {
    const u = user as unknown as User
    if (!u) return true

    const isSuperUser = u?.super_user || (u?.access as any)?.access?.some((a: any) => a.super_user)

    if (isSuperUser) return true

    const operatorId = typeof u?.operator === 'object' ? u?.operator?.id : u?.operator

    if (operatorId) {
      return { id: { equals: operatorId } } as Where
    }

    return false
  },
  access: {
    create: ({ req: { user } }) => {
      const u = user as unknown as User
      const isSuperUser =
        u?.super_user || (u?.access as any)?.access?.some((a: any) => a.super_user)
      return !!isSuperUser
    },
    update: ({ req: { user } }) => {
      const u = user as unknown as User
      const isSuperUser =
        u?.super_user || (u?.access as any)?.access?.some((a: any) => a.super_user)
      return !!isSuperUser
    },
  },
  admin: {
    position: 'sidebar',
  },
})

/**
 * Creates a restaurant relationship field filtered by operator.
 */
export const getRestaurantField = (
  opts: {
    requireEventEnabled?: boolean
    /** Overrides the field label (default 'Restaurant'). fnb-menu-events → 'Venue'. */
    label?: string
    /** Overrides admin.description. Default = today's text (depends on requireEventEnabled). */
    description?: string
    /** admin.components.Field path — swaps the input for a custom component. */
    fieldComponentPath?: string
    /**
     * When true (default — matches existing behavior on every other
     * collection using this field), only a super user may set/change this
     * field's value; a non-super user is stuck with whatever `defaultValue`
     * put here (their pinned `restaurant`, if any) and can never pick one
     * themselves. Pass `false` for a collection whose own `create`/`update`
     * access already gates who may touch the document (e.g.
     * `ownershipAccessRefine`) and where a non-super, non-restaurant-pinned
     * user is expected to actively choose one — `fnb-menu-events` needs this
     * so a non-super event owner can pick or create a Venue at all;
     * `filterOptions` above still scopes the choices to their own operator
     * (+ `event_enabled` when `requireEventEnabled`).
     */
    restrictWriteToSuperUser?: boolean
  } = {},
): Field => {
  const {
    requireEventEnabled = false,
    label,
    description,
    fieldComponentPath,
    restrictWriteToSuperUser = true,
  } = opts
  // When the field is for the event collection, every allowed restaurant must also
  // have opted in via restaurants.event_enabled.
  const scope = (base?: Where): Where | boolean => {
    if (!requireEventEnabled) return base ?? true
    const eventClause: Where = { event_enabled: { equals: true } }
    return base ? { and: [base, eventClause] } : eventClause
  }
  return {
    type: 'relationship',
    name: 'restaurant',
    label: label ?? 'Restaurant',
    required: true,
    relationTo: 'restaurants',
    defaultValue: ({ user }) => {
      const u = user as unknown as User
      if (u?.restaurant) {
        return typeof u.restaurant === 'object' ? u.restaurant.id : u.restaurant
      }
    },
    filterOptions: ({ data, user }) => {
      const u = user as unknown as User
      if (!u) return scope()

      const isSuperUser = u?.super_user || (u?.access as any)?.access?.some((a: any) => a.super_user)

      if (isSuperUser) return scope()

      // If user is restricted to a specific restaurant, only show that one
      const userRestaurantId = typeof u?.restaurant === 'object' ? u?.restaurant?.id : u?.restaurant
      if (userRestaurantId) {
        return scope({ id: { equals: userRestaurantId } })
      }

      // Otherwise, filter by the selected operator in the form
      const operatorId =
        (typeof data?.operator === 'object' ? data?.operator?.id : data?.operator) ||
        (typeof data?.info?.operator === 'object' ? data?.info?.operator?.id : data?.info?.operator)

      if (operatorId) {
        return scope({ operator: { equals: operatorId } })
      }

      return false
    },
    access: {
      create: ({ req: { user } }) => {
        if (!restrictWriteToSuperUser) return true
        const u = user as unknown as User
        const isSuperUser =
          u?.super_user || (u?.access as any)?.access?.some((a: any) => a.super_user)
        return !!isSuperUser
      },
      update: ({ req: { user } }) => {
        if (!restrictWriteToSuperUser) return true
        const u = user as unknown as User
        const isSuperUser =
          u?.super_user || (u?.access as any)?.access?.some((a: any) => a.super_user)
        return !!isSuperUser
      },
    },
    admin: {
      position: 'sidebar',
      appearance: 'drawer',
      description:
        description ??
        (requireEventEnabled
          ? 'Only restaurants marked "Available for events" appear here — set that on the Restaurant first.'
          : 'Select the restaurant. Filtered by the selected operator.'),
      ...(fieldComponentPath
        ? {
            components: {
              Field: fieldComponentPath,
            },
          }
        : {}),
    },
  }
}

export default getFields
