import { useLocation } from "react-router-dom";
import { MenuFilters, useMenuStore } from "../store";
import { addAnalytics } from "../../../../helpers/analytics";
import clsx from "clsx";
import { IoFilterCircle, IoFilterCircleOutline } from "react-icons/io5";
import { useState } from "react";
import useMenuNav from "../hooks/useMenuNav";

const FilterAllergens = () => {
  const { pathname } = useLocation();
  const allergens = useMenuStore((state) => state.allergens);
  const filters = useMenuStore((state) => state.filters);
  const setFilters = useMenuStore((state) => state.setFilters);
  const [showFilters, setShowFilters] = useState(false);
  const { isPreview } = useMenuNav();

  const handleFilters = (value: string, position?: number) => {
    const { allergens } = filters;
    const allergensSet = new Set(allergens);
    if (allergensSet.has(value)) {
      allergensSet.delete(value);
    } else {
      allergensSet.add(value);
    }
    const newAllergens = Array.from(allergensSet);
    const newFilters: MenuFilters = { ...filters, allergens: newAllergens };

    addAnalytics(
      "click",
      pathname,
      {
        additionalData: { allergens: value, position },
      },
      isPreview === "true",
    );

    setFilters(newFilters);
  };

  return (
    <>
      <label className="swap">
        <input
          type="checkbox"
          onChange={() => setShowFilters(!showFilters)}
          checked={showFilters}
        />
        <div
          className={clsx(
            "swap-on flex flex-row gap-1 items-center",
            `text-menu-primary`,
            "text-lg",
            `font-menu-primary`,
          )}
        >
          <IoFilterCircle />
          <p className="text-xs">Filter by allergens</p>
        </div>

        <div
          className={clsx(
            "swap-off flex flex-row gap-1 items-center",
            `text-menu-neutral`,
            "text-lg",
            `font-menu-primary`,
          )}
        >
          <IoFilterCircleOutline />
          <p className="text-xs">Filter by allergens</p>
        </div>
      </label>
      <div className="collapse p-0 m-0 rounded-none">
        <input
          hidden
          type="checkbox"
          checked={showFilters}
          onChange={() => setShowFilters(!showFilters)}
        />

        <div
          className={clsx(
            "collapse-content p-0 m-0 rounded-none border border-t-0 border-x-0",
            `border-b-menu-neutral`,
          )}
        >
          <div
            className={clsx(
              "transition-all duration-150",
              "grid grid-cols-3 py-2 gap-2",
            )}
          >
            {allergens &&
              allergens?.map((a, pos) => {
                const checked = filters.allergens?.includes(a.slug);
                const id = `filter-allergen-${a.id}`;
                return (
                  <div key={id} className="form-control">
                    <label className="label cursor-pointer">
                      <span
                        className={clsx(
                          `label-text text-xs font-menu-primary`,
                          checked
                            ? `font-bold text-menu-primary`
                            : `text-menu-neutral`,
                        )}
                      >
                        {a.title}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        className={clsx(
                          "checkbox checkbox-xs",
                          `checked:bg-menu-neutral`,
                        )}
                        onChange={() => handleFilters(a.slug, pos + 1)}
                      />
                    </label>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterAllergens;
