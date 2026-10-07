import clsx from "clsx";
import { MenuItemAvailability, MenuFilters, useMenuStore } from "../store";
import { FaSun, FaCoffee, FaUtensils, FaMoon } from "react-icons/fa";
import useMenuNav from "../hooks/useMenuNav";

interface AvailabilityOption {
  value: MenuItemAvailability;
  label: string;
  icon: React.ReactNode;
}

const availabilityOptions: AvailabilityOption[] = [
  {
    value: "all_day",
    label: "All Day",
    icon: <FaSun className="w-3 h-3" />,
  },
  {
    value: "breakfast",
    label: "Breakfast",
    icon: <FaCoffee className="w-3 h-3" />,
  },
  {
    value: "lunch",
    label: "Lunch",
    icon: <FaUtensils className="w-3 h-3" />,
  },
  {
    value: "dinner",
    label: "Dinner",
    icon: <FaMoon className="w-3 h-3" />,
  },
];

const FilterAvailability = () => {
  const { selectedAvailability, handleSelectAvailability } = useMenuNav();
  const filters = useMenuStore((state) => state.filters);
  const setFilters = useMenuStore((state) => state.setFilters);

  const handleFilters = (value: MenuItemAvailability, position?: number) => {
    const newValue = selectedAvailability === value ? "all_day" : value;

    handleSelectAvailability(newValue, position);
    const newFilters: MenuFilters = { ...filters, availability: newValue };
    setFilters(newFilters);
  };

  return (
    <>
      {availabilityOptions.map((option, pos) => {
        const selected = selectedAvailability === option.value;
        return (
          <button
            key={option.value}
            className={clsx(
              "px-3 py-1 font-menu-primary rounded-full text-xs whitespace-nowrap flex items-center gap-2",
              selected
                ? `bg-menu-primary text-menu-primary-contrast`
                : `border border-menu-primary text-menu-primary`,
            )}
            onClick={() => handleFilters(option.value, pos + 1)}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </>
  );
};

export default FilterAvailability;
