import { FaRegBell } from "react-icons/fa";
import {
  BlockHeader as BlockHeaderType,
  MenuMedia,
} from "../../../../types/payload-types";
import { MdLanguage } from "react-icons/md";
import { useMemo } from "react";
import clsx from "clsx";
import { useRestaurantStore } from "../store";
import useMenuNav from "../hooks/useMenuNav";

interface BlockHeaderProps {
  block: BlockHeaderType;
}

export const BlockHeader = ({ block }: BlockHeaderProps) => {
  const { handleSelectLanguage, selectedLanguage } = useMenuNav();
  const restaurant = useRestaurantStore((state) => state.restaurant);

  const { label, logo } = useMemo(() => {
    let label = "";
    let logo: MenuMedia | null = null;

    const {
      c: { label: labelBlock, logo: logoBlock },
    } = block;

    label = labelBlock || restaurant?.name || "Menu";
    logo = (logoBlock as MenuMedia) || (restaurant?.logo as MenuMedia) || null;

    return {
      label,
      logo,
    };
  }, [block, restaurant]);

  const handleRefetch: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    handleSelectLanguage(e.target.checked ? "en" : "ar");
    window.location.reload();
  };

  return (
    <div className={clsx("w-full flex flex-row justify-between items-center")}>
      <div className="flex flex-row gap-1 items-center">
        {logo && (
          <img
            className="aspect-square h-8 w-auto object-contain"
            src={(logo as MenuMedia)?.url || ""}
            alt={(logo as MenuMedia)?.filename || ""}
          />
        )}
        {label && (
          <h1
            className={clsx(`text-menu-primary`, "font-bold", "font-menu-primary")}
          >
            {label}
          </h1>
        )}
      </div>

      <div className="flex flex-row gap-2 items-center">
        <div className="flex flex-row gap-1 items-center">
          {block?.c?.show_language && (
            <>
              <label className="swap">
                <input
                  type="checkbox"
                  onChange={handleRefetch}
                  checked={selectedLanguage === "en"}
                />
                <div
                  className={clsx(
                    `text-menu-primary`,
                    "swap-on text-sm",
                    `font-menu-primary`,
                  )}
                >
                  EN
                </div>
                <div
                  className={clsx(
                    `text-menu-primary`,
                    "swap-off text-sm",
                    `font-menu-primary`,
                  )}
                >
                  AR
                </div>
              </label>
              <MdLanguage className={clsx(`text-menu-primary`, "h-4 w-auto")} />
            </>
          )}
        </div>
        {block?.c?.show_notification && (
          <FaRegBell className={clsx(`text-menu-primary`, "h-6 w-auto")} />
        )}
      </div>
    </div>
  );
};
