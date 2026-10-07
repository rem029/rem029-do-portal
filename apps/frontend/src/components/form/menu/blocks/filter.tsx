import { BlockFilter as BlockFilterType } from "../../../../types/payload-types";
import { useEffect, useMemo, useState } from "react";
import { MenuFilters, MenuItemWithCategory, useMenuStore } from "../store";
import useMenuNav from "../hooks/useMenuNav";
import { clsx } from "clsx";
import { CiSearch } from "react-icons/ci";
import useDebounce from "../../../../hooks/use-debounce";
import Fuse from "fuse.js";
import { IoMdCloseCircle } from "react-icons/io";
import FilterCategories from "../components/filter-categories";
import FilterAllergens from "../components/filter-allergens";
import FilterAvailability from "../components/filter-availability";

interface BlockFilterProps {
  block: BlockFilterType;
}

export const BlockFilter = ({ block }: BlockFilterProps): JSX.Element => {
  const { searchText, handleSearchText, handleSelectCategory } = useMenuNav();

  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);

  const [searchInput, setSearchInput] = useState(searchText || "");

  const searchValue = useDebounce({ value: searchInput, delay: 300 });

  const setFilters = useMenuStore((state) => state.setFilters);
  const filters = useMenuStore((state) => state.filters);
  const items = useMenuStore((state) => state.items);

  // handle search predictive text here
  const suggestions: MenuItemWithCategory[] = useMemo(() => {
    if (!searchInput.trim() || searchInput.length < 2) return [];

    const fuse = new Fuse(items, {
      keys: ["item.title", "item.description"],
      threshold: 0.4,
      includeScore: true,
    });

    const results = fuse.search(searchInput);

    // Get unique suggestions (remove duplicates by item title)
    const uniqueSuggestions = new Map();
    results.forEach((result) => {
      const title = result.item.item?.title;
      if (title && !uniqueSuggestions.has(title)) {
        uniqueSuggestions.set(title, result.item);
      }
    });

    return Array.from(uniqueSuggestions.values()).slice(0, 5); // Limit to 5 suggestions
  }, [searchInput, items]);

  useEffect(() => {
    if (suggestions.length > 1) {
      setSuggestionsVisible(true);
    } else {
      setSuggestionsVisible(false);
    }
  }, [suggestions]);

  // add analytics for search terms
  useEffect(() => {
    handleFilters(searchValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const hasFilters = useMemo(() => {
    if (filters?.search) return true;
    if (filters?.allergens && filters.allergens.length > 0) return true;

    return false;
  }, [filters]);

  const resetFilters = () => {
    handleSearchText("");
    setSearchInput("");
    handleSelectCategory(undefined);
    setFilters({ ...filters, allergens: undefined, search: undefined });
  };

  const handleFilters = (value: string | undefined) => {
    handleSearchText(value as string);
    const newFilters: MenuFilters = { ...filters, search: value };

    setFilters(newFilters);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    setSuggestionsVisible(false);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row overflow-x-auto gap-2 py-2">
        <FilterCategories />
      </div>

      <div className="flex flex-row overflow-x-auto gap-2 py-2">
        <FilterAvailability />
      </div>

      {block?.c?.showSearch && (
        <div className={clsx(`flex flex-row w-full transition-[width] duration-300`, "py-2")}>
          <label
            className={clsx(
              "input input-sm pl-1 font-menu-primary  flex flex-1 items-center gap-2 transition-all duration-500",
              searchFocused ? `input-bordered` : `input-ghost`,
            )}
          >
            <input
              type="text"
              className="grow"
              placeholder="Search menu..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <CiSearch className={clsx("h-4 w-4 opacity-70", `text-menu-neutral`)} />
          </label>
        </div>
      )}

      {suggestionsVisible && suggestions.length > 0 && (
        <div className="flex flex-col items-start overflow-x-auto gap-2 py-2">
          <p className={clsx("text-xs font-menu-primary text-menu-neutral")}>Suggestions:</p>
          <div className="flex flex-row overflow-x-auto gap-2 py-2">
            {suggestions.map((s) => (
              <button
                key={s.item.id}
                className={clsx(
                  "font-menu-secondary px-3 py-1 rounded-full text-xs whitespace-nowrap border-[0.5px] opacity-50",
                  `text-menu-neutral`,
                  `border-menu-neutral`,
                )}
                onClick={() => handleSuggestionClick(s.item?.title || "")}
              >
                {s.item?.title || "No Title"}
              </button>
            ))}
          </div>
        </div>
      )}

      {block?.c?.showAllergenFilters && (
        <div className={clsx(`flex flex-col w-full items-start justify-start`, "py-2")}>
          <FilterAllergens />
        </div>
      )}

      {hasFilters && (
        <div className={clsx(`flex flex-col w-full items-start justify-start`, "py-2")}>
          <button
            className={clsx("link text-xs", `text-menu-neutral font-menu-primary`)}
            onClick={() => resetFilters()}
          >
            Reset Filters <IoMdCloseCircle className="inline text-sm" />
          </button>
        </div>
      )}
    </div>
  );
};
