import {
  BlockItems as BlockItemsType,
  MenuAllergen,
  MenuItem,
} from "../../../../types/payload-types";
import { useMemo } from "react";
import { ROOT_KEYS, useMenuStore } from "../store";
import { clsx } from "clsx";
import Fuse from "fuse.js";
import MenuCard from "../components/cards";

interface BlockItemsProps {
  block: BlockItemsType;
}

export const BlockItems = ({ block }: BlockItemsProps) => {
  const {
    c: { title, description },
  } = block;

  const items = useMenuStore((state) => state.items);
  const categories = useMenuStore((state) => state.categories);
  const filters = useMenuStore((state) => state.filters);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (filters?.search) {
      const fuse = new Fuse(filtered, {
        keys: ["item.title", "item.description", "item.allergen.title"],
        threshold: 0.5,
        findAllMatches: true,
        isCaseSensitive: false,
        includeScore: true,
      });
      const results = fuse.search(filters.search);
      results.sort((a, b) => (a.score || 0) - (b.score || 0));

      filtered = results.map((r) => r.item);
    }

    if (filters?.category) {
      filtered = filtered.filter((i) => i.categorySlug === filters.category);
    }

    if (filters?.availability) {
      filtered = filtered.filter((i) =>
        i?.item?.availability_period?.includes(filters.availability!),
      );
    }

    if (filters?.allergens) {
      filtered = filtered.filter((i) => {
        const itemAllergens =
          i.item?.allergen?.map((a) => (a as MenuAllergen).slug) || [];

        return filters.allergens?.every((fa) => itemAllergens.includes(fa));
      });
    }

    const seen = new Set();
    filtered = filtered.filter((menuItem) => {
      const itemId = menuItem.item?.id;
      if (seen.has(itemId)) {
        return false;
      }
      seen.add(itemId);
      return true;
    });

    return filtered;
  }, [items, filters]);

  return (
    <div className={clsx("flex flex-col gap-4 min-h-[1080px]")}>
      {title && (
        <h2
          className={clsx(
            "text-lg",
            "font-bold",
            `text-[var(${ROOT_KEYS.PRIMARY})]`,
            "font-menu-primary",
          )}
        >
          {title}
        </h2>
      )}
      {description && (
        <p
          className={clsx(
            `text-sm`,
            `text-[var(${ROOT_KEYS.NEUTRAL})]`,
            "font-menu-secondary",
          )}
        >
          {description}
        </p>
      )}

      {filteredItems?.map((i, idx) => {
        const category = categories.find((c) => c.slug === i?.categorySlug);
        const key = category?.id + "_" + i.item?.id || idx;
        const item = i.item as MenuItem;
        return <MenuCard key={key} item={item} position={idx} />;
      })}

      {filteredItems?.length === 0 && (
        <p className={clsx("text-sm", `text-menu-neutral`)}>No items found</p>
      )}
    </div>
  );
};
