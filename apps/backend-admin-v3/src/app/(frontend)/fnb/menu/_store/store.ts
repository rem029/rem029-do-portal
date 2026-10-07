import { create } from 'zustand'
import { MenuAllergen, MenuCategory, MenuItem, Restaurant } from '@/payload-types'
import { getAllergensAction } from '../_actions'
import type { OrderingContext } from '../_actions/orders'

export type MenuItemAvailability = NonNullable<MenuItem['availability_period']>[number]
export interface MenuItemWithCategory {
  item: MenuItem
  categorySlug: string
}

export const UNCATEGORIZED_CATEGORY_SLUG = '__uncategorized__'

// Intentional synthetic placeholder for items with no assigned category
export const UNCATEGORIZED_CATEGORY = {
  id: UNCATEGORIZED_CATEGORY_SLUG,
  slug: UNCATEGORIZED_CATEGORY_SLUG,
  title: 'Others',
} as unknown as MenuCategory

export interface MenuFilters {
  search?: string
  allergens?: string[]
  category?: string
  availability?: MenuItemAvailability
}

interface MenuItemsState {
  // Items are fetched on demand, one category at a time (see _hooks/useMenuItems.ts),
  // instead of being preloaded in full - itemsByCategorySlug is the fetch cache,
  // loadedCategorySlugs tracks fetch order for the "All" tab's infinite scroll.
  itemsByCategorySlug: Record<string, MenuItemWithCategory[]>
  loadedCategorySlugs: string[]
  searchResults: MenuItemWithCategory[] | undefined
  isLoadingItems: boolean
  // Separate from isLoadingItems - the main items list (blocks/items.tsx) no longer
  // reacts to search at all (search results only ever render inside the search
  // overlay), so a search fetch shouldn't flip the main list's own loading flag and
  // vice versa. Owned by useMenuItems.ts's search effect, consumed by search-overlay.tsx.
  isSearchLoading: boolean
  categories: MenuCategory[]
  allergens: MenuAllergen[] | undefined
  filters: MenuFilters
  availability: MenuItemAvailability
  showFilters: boolean
  showSearch: boolean
  searchOverlayOpen: boolean
  selectedItemSlug: string | undefined
  setShowFilters: (showFilters: boolean) => void
  setShowSearch: (showSearch: boolean) => void
  setSearchOverlayOpen: (searchOverlayOpen: boolean) => void
  setAvailability: (availability: MenuItemAvailability) => void
  setAllergens: (restaurant: MenuAllergen[]) => void
  setCategoryItems: (categorySlug: string, items: MenuItemWithCategory[]) => void
  setSearchResults: (results: MenuItemWithCategory[] | undefined) => void
  setIsLoadingItems: (isLoading: boolean) => void
  setIsSearchLoading: (isLoading: boolean) => void
  resetItemCache: () => void
  setCategories: (categories: MenuCategory[]) => void
  // Merges into the CURRENT store state (not a caller-supplied full object) - every
  // caller used to do `setFilters({ ...filters, x: y })` with its own render-time
  // `filters` closure. useMenuNav() is called independently by several components, each
  // with its own effect syncing filters from the URL - two of those effects racing (one
  // reading a stale `filters` snapshot from before the other's update landed) could
  // overwrite each other's field and produce a real extra value transition, which
  // useMenuItems.ts's search effect would see as a second, redundant search fetch for
  // what should have been one value change. Merging from live state on every call
  // removes that race entirely (found & fixed post-12C-6, "search fires twice").
  updateFilters: (partial: Partial<MenuFilters>) => void
  setSelectedItemSlug: (slug?: string) => void
  fetchAllergens: (language: string) => Promise<void>
  // The items block's own overflow-y-auto scroll container in the sticky-header/filter
  // layout (see fnb-menu.tsx's isStickyShellLayout) - null when a page doesn't match
  // that layout (plain window-scrolling fallback). Shared via the store since the
  // scroll-to-top button is a sibling of the items block, not its parent/child.
  itemsScrollElement: HTMLElement | null
  setItemsScrollElement: (node: HTMLElement | null) => void
}

export interface RestaurantState {
  restaurant: Restaurant | undefined
  setRestaurant: (restaurant: Restaurant) => void
  orderingEnabled: boolean
  setOrderingEnabled: (orderingEnabled: boolean) => void
  showPrices: boolean
  setShowPrices: (showPrices: boolean) => void
  orderingContext: OrderingContext | null
  setOrderingContext: (orderingContext: OrderingContext | null) => void
}

export const useMenuStore = create<MenuItemsState>((set) => ({
  itemsByCategorySlug: {},
  loadedCategorySlugs: [],
  searchResults: undefined,
  isLoadingItems: false,
  isSearchLoading: false,
  setCategoryItems: (categorySlug: string, items: MenuItemWithCategory[]) =>
    set((state) => ({
      itemsByCategorySlug: { ...state.itemsByCategorySlug, [categorySlug]: items },
      loadedCategorySlugs: state.loadedCategorySlugs.includes(categorySlug)
        ? state.loadedCategorySlugs
        : [...state.loadedCategorySlugs, categorySlug],
    })),
  setSearchResults: (results?: MenuItemWithCategory[]) => set({ searchResults: results }),
  setIsLoadingItems: (isLoadingItems: boolean) => set({ isLoadingItems }),
  setIsSearchLoading: (isSearchLoading: boolean) => set({ isSearchLoading }),
  resetItemCache: () =>
    set({
      itemsByCategorySlug: {},
      loadedCategorySlugs: [],
    }),
  categories: [] as MenuCategory[],
  setCategories: (categories: MenuCategory[]) => set({ categories }),
  filters: {
    search: '',
    allergens: [],
    category: undefined,
  },
  showFilters: false,
  setShowFilters: (showFilters: boolean) => set({ showFilters }),
  showSearch: true,
  setShowSearch: (showSearch: boolean) => set({ showSearch }),
  searchOverlayOpen: false,
  setSearchOverlayOpen: (searchOverlayOpen: boolean) => set({ searchOverlayOpen }),
  updateFilters: (partial: Partial<MenuFilters>) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  selectedItemSlug: undefined,
  setSelectedItemSlug: (slug?: string) => set({ selectedItemSlug: slug }),
  allergens: undefined,
  setAllergens: (allergens: MenuAllergen[]) => set({ allergens }),
  availability: 'all_day',
  setAvailability: (availability: MenuItemAvailability) => set({ availability }),
  itemsScrollElement: null,
  setItemsScrollElement: (itemsScrollElement: HTMLElement | null) => set({ itemsScrollElement }),
  fetchAllergens: async (language: string) => {
    const result = await getAllergensAction(language)
    if (result.success && result.data) {
      set({
        allergens: result.data as MenuAllergen[],
      })
    }
  },
}))

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurant: undefined,
  setRestaurant: (restaurant: Restaurant) => set({ restaurant }),
  orderingEnabled: false,
  setOrderingEnabled: (orderingEnabled: boolean) => set({ orderingEnabled }),
  showPrices: true,
  setShowPrices: (showPrices: boolean) => set({ showPrices }),
  orderingContext: null,
  setOrderingContext: (orderingContext: OrderingContext | null) => set({ orderingContext }),
}))

const PRIMARY = '--primary-color'
const PRIMARY_CONTRAST = '--primary-contrast-color'
const BACKGROUND = '--background-color'
const BACKGROUND_CARD = '--background-card-color'
const TEXT = '--text-color'
const NEUTRAL = '--neutral-color'
const FONT_PRIMARY = '--font-menu-primary'
const FONT_SECONDARY = '--font-menu-secondary'

export const ROOT_KEYS = {
  PRIMARY,
  PRIMARY_CONTRAST,
  BACKGROUND,
  BACKGROUND_CARD,
  TEXT,
  NEUTRAL,
  FONT_PRIMARY,
  FONT_SECONDARY,
}
