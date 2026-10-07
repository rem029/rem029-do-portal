import { useEffect, useMemo } from "react";
import { MenuAllergen, MenuItem, MenuMedia } from "../../../../types/payload-types";
import { useMenuStore } from "../store";
import { clsx } from "clsx";
import { IoClose } from "react-icons/io5";
import { addAnalytics } from "../../../../helpers/analytics";
import { useLocation } from "react-router-dom";
import useMenuNav from "../hooks/useMenuNav";

interface ViewItemProps {
  selectedItemSlug: string;
  handleClose?: () => void;
}

const ViewItem = ({ selectedItemSlug, handleClose }: ViewItemProps) => {
  const { selectedLanguage, isPreview } = useMenuNav();
  const { pathname } = useLocation();
  const items = useMenuStore((state) => state.items);

  const item: MenuItem | undefined = useMemo(() => {
    if (!selectedItemSlug) return undefined;

    const foundItem = items?.find(
      (i) => (i.item as MenuItem).slug === selectedItemSlug,
    );

    if (!foundItem || !foundItem?.item) {
      return undefined;
    }

    return foundItem.item as MenuItem;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemSlug, items]);

  useEffect(() => {
    if (selectedItemSlug) {
      addAnalytics(
        "page_view",
        pathname,
        {
          additionalData: { slug: selectedItemSlug },
        },
        isPreview === "true",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!item) return <></>;

  return (
    <div
      className={clsx(
        "rounded-lg w-full max-w-md overflow-hidden",
        "flex flex-col gap-1",
        "relative",
        `bg-menu-background-card`,
      )}
      dir={selectedLanguage === "ar" ? "rtl" : "ltr"}
    >
      <div
        className={clsx(
          "absolute top-0 w-full h-10 p-2",
          "flex flex-row items-center justify-between",
          "transition-all duration-150",
          "bg-opacity-0 hover:bg-opacity-25",
          `bg-gray-950`,
        )}
      >
        <span>{/* spacer */}</span>
        <span
          className={clsx(
            "text-menu-primary",
            "flex flex-row items-center gap-1",
            "cursor-pointer",
          )}
          onClick={() => (handleClose ? handleClose() : null)}
        >
          <IoClose className="inline h-6 w-auto" />
        </span>
      </div>
      <img
        className="aspect-video w-full h-auto object-cover"
        src={(item?.image as MenuMedia)?.url || ""}
        alt={(item?.image as MenuMedia)?.filename || "no-image"}
      />
      <div className="flex flex-col gap-4 p-2">
        <h6
          className={clsx(
            "text-menu-primary font-menu-primary",
            "text-lg",
            "font-bold",
          )}
        >
          {item.title}
        </h6>
        {item?.description && (
          <p
            className={clsx(
              "text-menu-neutral font-menu-secondary",
              "text-xs",
              `line-clamp-3`,
              `min-h-12`,
            )}
          >
            {item?.description}
          </p>
        )}

        <div className="flex flex-1 flex-col">
          <p className={clsx("text-menu-neutral font-menu-primary", "text-[8px]")}>
            Allergens
          </p>
          {item?.allergen && item?.allergen.length > 0 && (
            <div className="flex flex-row gap-1 flex-wrap items-end">
              {item?.allergen?.map((a, aidx) => {
                const allergen = a as MenuAllergen;
                const akey = allergen?.id || aidx;
                return (
                  <span
                    key={akey}
                    className={clsx(
                      "text-[12px]",
                      `border-[0.5px]`,
                      `rounded-full`,
                      `px-1 py-[.5px]`,
                      `text-menu-neutral font-menu-secondary`,
                      `border-menu-neutral`,
                    )}
                  >
                    <span className="mr-1">{allergen?.title}</span>
                    <span>O</span>
                  </span>
                );
              })}
            </div>
          )}

          {item?.allergen?.length === 0 && (
            <span
              className={clsx(`text-menu-neutral font-menu-secondary`, "text-[8px]")}
            >
              None
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-row items-end justify-between">
          {item?.price && (
            <span
              className={clsx(
                `text-menu-text  font-menu-primary`,
                "font-bold",
                `text-lg`,
              )}
            >
              QAR {item?.price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewItem;
