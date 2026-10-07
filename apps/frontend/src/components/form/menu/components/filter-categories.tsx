import clsx from "clsx";
import { MenuCategory } from "../../../../types/payload-types";
import useMenuNav from "../hooks/useMenuNav";
import { MenuFilters, useMenuStore } from "../store";

const FilterCategories = () => {
  const { selectedCategorySlug, handleSelectCategory } = useMenuNav();
  const categories = useMenuStore((state) => state.categories);
  const filters = useMenuStore((state) => state.filters);
  const setFilters = useMenuStore((state) => state.setFilters);

  const handleFilters = (value: string | undefined, position?: number) => {
    handleSelectCategory(value, position);
    const newFilters: MenuFilters = { ...filters, category: value };
    setFilters(newFilters);
  };
  return (
    <>
      <button
        className={clsx(
          "px-3 py-1 font-menu-primary rounded-full text-xs whitespace-nowrap",
          !selectedCategorySlug
            ? `bg-menu-primary text-menu-primary-contrast`
            : `border border-menu-primary text-menu-primary`,
        )}
        onClick={() => handleFilters(undefined, 0)}
      >
        All
      </button>
      {categories?.map((category, pos) => {
        const c = category as MenuCategory;
        const selected = selectedCategorySlug === c.slug;
        return (
          <button
            key={c.id}
            className={clsx(
              "px-3 py-1 font-menu-primary rounded-full text-xs whitespace-nowrap",
              selected
                ? `bg-menu-primary text-menu-primary-contrast`
                : `border border-menu-primary text-menu-primary`,
            )}
            onClick={() => handleFilters(c.slug, pos + 1)}
          >
            {c?.title || "No Title"}
          </button>
        );
      })}
    </>
  );
};

export default FilterCategories;
