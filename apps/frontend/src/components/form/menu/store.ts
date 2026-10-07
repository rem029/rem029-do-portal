import { create } from "zustand";
import {
  MenuAllergen,
  MenuCategory,
  MenuItem,
  Restaurant,
} from "../../../types/payload-types";

export type MenuItemAvailability = NonNullable<
  MenuItem["availability_period"]
>[number];
export interface MenuItemWithCategory {
  item: MenuItem;
  categorySlug: string;
}

export interface MenuFilters {
  search?: string;
  allergens?: string[];
  category?: string;
  availability?: MenuItemAvailability;
}

interface MenuItemsState {
  items: MenuItemWithCategory[];
  categories: MenuCategory[];
  allergens: MenuAllergen[] | undefined;
  filters: MenuFilters;
  availability: MenuItemAvailability;
  setAvailability: (availability: MenuItemAvailability) => void;
  setAllergens: (restaurant: MenuAllergen[]) => void;
  setItems: (items: MenuItemWithCategory[]) => void;
  setCategories: (categories: MenuCategory[]) => void;
  setFilters: (filters: MenuFilters) => void;
}

export interface RestaurantState {
  restaurant: Restaurant | undefined;
  setRestaurant: (restaurant: Restaurant) => void;
}

export const useMenuStore = create<MenuItemsState>((init) => ({
  items: [] as MenuItemWithCategory[],
  setItems: (items: MenuItemWithCategory[]) => init({ items }),
  categories: [] as MenuCategory[],
  setCategories: (categories: MenuCategory[]) => init({ categories }),
  filters: {
    search: "",
    allergens: [],
    category: undefined,
  },
  setFilters: (filters: MenuFilters) => init({ filters }),
  allergens: undefined,
  setAllergens: (allergens: MenuAllergen[]) => init({ allergens }),
  availability: "all_day",
  setAvailability: (availability: MenuItemAvailability) => init({ availability }),
}));

export const useRestaurantStore = create<RestaurantState>((init) => ({
  restaurant: undefined,
  setRestaurant: (restaurant: Restaurant) => init({ restaurant }),
}));

const PRIMARY = "--primary-color";
const PRIMARY_CONTRAST = "--primary-contrast-color";
const BACKGROUND = "--background-color";
const BACKGROUND_CARD = "--background-card-color";
const TEXT = "--text-color";
const NEUTRAL = "--neutral-color";
const FONT_PRIMARY = "--font-menu-primary";
const FONT_SECONDARY = "--font-menu-secondary";

export const ROOT_KEYS = {
  PRIMARY,
  PRIMARY_CONTRAST,
  BACKGROUND,
  BACKGROUND_CARD,
  TEXT,
  NEUTRAL,
  FONT_PRIMARY,
  FONT_SECONDARY,
};
