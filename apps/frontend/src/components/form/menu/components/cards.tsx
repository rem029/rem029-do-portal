import clsx from "clsx";
import { FaCaretRight } from "react-icons/fa";
import { MenuMedia, MenuAllergen, MenuItem } from "../../../../types/payload-types";
import useMenuNav from "../hooks/useMenuNav";

interface MenuCardProps {
  item: MenuItem;
  position?: number;
}

const MenuCard = ({ item, position }: MenuCardProps) => {
  const { handleSelectItem } = useMenuNav();
  const image = item?.image as MenuMedia;

  return (
    <div
      className={clsx(
        "flex flex-row",
        `bg-menu-background-card`,
        `border-menu-neutral`,
        `border-b-[0.5px]`,
        `rounded-s-lg`,
        `overflow-hidden`,
      )}
    >
      <div className="flex w-full max-w-36 h-auto aspect-square">
        <img
          src={(image as MenuMedia)?.url || ""}
          alt={(image as MenuMedia)?.filename || "no-image"}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2">
        <h6
          className={clsx(
            "text-xs",
            "font-bold font-menu-primary",
            `text-menu-primary`,
          )}
        >
          {item.title}
        </h6>
        {item?.description && (
          <p
            className={clsx(
              "text-xs font-menu-secondary",
              `text-menu-neutral`,
              `line-clamp-3`,
              `min-h-12`,
            )}
          >
            {item?.description}
          </p>
        )}

        <div className="flex flex-1 flex-col">
          <p className={clsx("text-[8px]", `text-menu-neutral font-menu-primary`)}>
            Allergens
          </p>
          {item?.allergen && item?.allergen.length > 0 && (
            <div className="flex flex-row gap-1 flex-wrap items-end">
              {item?.allergen.slice(0, 3).map((a, aidx) => {
                const allergen = a as MenuAllergen;
                const akey = allergen?.id || aidx;
                return (
                  <span
                    key={akey}
                    className={clsx(
                      "text-[8px]",
                      `text-menu-neutral`,
                      `border-[0.5px]`,
                      `border-menu-neutral`,
                      `rounded-lg`,
                      `px-1 py-[.5px]`,
                    )}
                  >
                    <span className="mr-1 font-menu-secondary">
                      {allergen?.title}
                    </span>
                    <span>O</span>
                  </span>
                );
              })}

              {item?.allergen.length > 3 && (
                <span className={clsx("text-[8px]", `text-menu-neutral`)}>...</span>
              )}
            </div>
          )}

          {item?.allergen?.length === 0 && (
            <span
              className={clsx("text-[8px]", `text-menu-neutral font-menu-secondary`)}
            >
              None
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-row items-end justify-between">
          {item?.price && (
            <span
              className={clsx(
                "font-bold font-menu-primary",
                `text-xs`,
                `text-menu-text`,
              )}
            >
              QAR {item?.price}
            </span>
          )}

          <span
            className={clsx(
              "flex flex-row items-center gap-1",
              "text-[8px]",
              `text-menu-neutral cursor-pointer`,
            )}
            onClick={() => handleSelectItem(item.slug, position)}
          >
            <span className="font-menu-primary">Read more</span>
            <FaCaretRight className="inline h-2 w-auto" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
