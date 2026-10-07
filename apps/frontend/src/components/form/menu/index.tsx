import { BACKEND_URL } from "../../../utils/constants";
import {
  Menu,
  MenuCategory,
  MenuItem,
  MenuMedia,
  MenuPage,
  Restaurant,
} from "../../../types/payload-types";
import { RenderBlocks } from "./components/render-blocks";
import clsx from "clsx";
import { useEffect, useMemo } from "react";
import { addAnalytics } from "../../../helpers/analytics";
import { useLocation } from "react-router-dom";
import useMenuNav from "./hooks/useMenuNav";
import Modal from "./components/modal";
import ViewItem from "./components/view-item";
import {
  MenuItemWithCategory,
  ROOT_KEYS,
  useMenuStore,
  useRestaurantStore,
} from "./store";
import { useLivePreview } from "@payloadcms/live-preview-react";

interface FnbMenuProps {
  initialData?: MenuPage;
}

const FnbMenu = ({ initialData }: FnbMenuProps) => {
  const {
    selectedItemSlug,
    selectedLanguage,
    selectedCategorySlug,
    searchText,
    handleSelectItem,
    isPreview,
  } = useMenuNav();
  const { pathname } = useLocation();
  const setMenuItems = useMenuStore((state) => state.setItems);
  const setCategories = useMenuStore((state) => state.setCategories);
  const filters = useMenuStore((state) => state.filters);
  const setFilters = useMenuStore((state) => state.setFilters);
  const setRestaurant = useRestaurantStore((state) => state.setRestaurant);

  const { isLoading, data } = useLivePreview({
    initialData: initialData as MenuPage,
    serverURL: BACKEND_URL,
    apiRoute: "/payload/api",
    depth: 5,
  });

  const content = useMemo(() => {
    if (isPreview === "true" || !isLoading) {
      return data;
    }
    return initialData as MenuPage;
  }, [data, initialData, isPreview, isLoading]);

  // on load add analytics here
  useEffect(() => {
    addAnalytics("page_view", pathname, undefined, isPreview === "true");

    setFilters({
      ...filters,
      category: selectedCategorySlug || undefined,
      search: searchText,
      // add alergen filter here
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (content?.c?.menus && content.c.menus.length > 0) {
      fillMenuItems();
    }

    setRestaurant(content?.info?.restaurant as Restaurant);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const fillMenuItems = () => {
    const menus = data?.c?.menus as Menu[];
    const items = [] as MenuItemWithCategory[];
    const categories = [] as MenuCategory[];

    for (const menu of menus) {
      categories.push(menu?.category as MenuCategory);

      if (menu.menu_items && menu.menu_items.length > 0) {
        for (const _item of menu.menu_items) {
          const category = menu?.category as MenuCategory;
          const item = _item?.item as unknown as MenuItem;
          items.push({ item, categorySlug: category.slug });
        }
      }
    }

    setMenuItems(items);
    setCategories(categories);
  };

  return (
    <>
      <style>{css(content)}</style>
      <Modal isOpen={!!selectedItemSlug} onClick={() => handleSelectItem()}>
        {selectedItemSlug && (
          <ViewItem
            selectedItemSlug={selectedItemSlug}
            handleClose={() => handleSelectItem()}
          />
        )}
      </Modal>

      <div
        className={clsx(
          `bg-menu-background`,
          `text-menu-text`,
          content.adv?.className || "",
          "w-full h-full",
        )}
        dir={selectedLanguage === "ar" ? "rtl" : "ltr"}
      >
        <div
          className={clsx(
            "mx-auto w-full max-w-md h-full flex flex-col items-center justify-center relative",
          )}
        >
          <RenderBlocks blocks={content?.c?.blk} />
        </div>
      </div>
    </>
  );
};

const css = (data: MenuPage) => {
  const styles = [""];
  const { c } = data;
  const vars = [
    `${ROOT_KEYS.PRIMARY}: ${c?.primary || "black"};`,
    `${ROOT_KEYS.PRIMARY_CONTRAST}: ${c?.primary_contrast || "white"};`,
    `${ROOT_KEYS.BACKGROUND}: ${c?.bg || "white"};`,
    `${ROOT_KEYS.BACKGROUND_CARD}: ${c?.bg_card || "white"};`,
    `${ROOT_KEYS.TEXT}: ${c?.text || "black"};`,
    `${ROOT_KEYS.NEUTRAL}: ${c?.neutral || "gray"};`,
  ];

  const getFileType = (fileName: string) => {
    const parts = fileName.split(".");
    return parts[parts.length - 1];
  };

  const getFileName = (fileName: string, type: string) => {
    if (!fileName) return "";
    const name = fileName.replace(`.${type}`, "");
    return `${name}`;
  };

  const getFontFormat = (type: string) => {
    switch (type) {
      case "woff2":
        return "woff2";
      case "woff":
        return "woff";
      case "ttf":
        return "truetype";
      case "otf":
        return "opentype";
      default:
        return "woff2"; // safe default if unknown
    }
  };

  const getFontFaceStyle = (font: MenuMedia) => {
    const type = getFileType(font?.filename || "");
    const fileName = getFileName(font?.filename || "", type);
    const format = getFontFormat(type);
    const url = font?.url || "";

    return {
      fileName: fileName,
      css: `
        @font-face {
          font-family: "${fileName}";
          src: local("${fileName}"), url(${url}) format("${format}");
          font-weight: normal;
          font-style: normal;
        }
      `,
    };
  };

  if (data?.c?.font_primary) {
    const font = getFontFaceStyle(data.c.font_primary as MenuMedia);
    vars.push(`${ROOT_KEYS.FONT_PRIMARY}: "${font.fileName}";`);
    styles.push(font.css);
  }
  if (data?.c?.font_secondary) {
    const font = getFontFaceStyle(data.c.font_secondary as MenuMedia);
    vars.push(`${ROOT_KEYS.FONT_SECONDARY}: "${font.fileName}";`);
    styles.push(font.css);
  }

  const root = [`:root {`, vars.join("\n"), `}`].join("\n");
  styles.push(root);
  styles.push(data.adv?.css ? data.adv.css : "");
  return styles.join("\n");
};

export default FnbMenu;
