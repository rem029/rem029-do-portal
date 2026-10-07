import { useLocation, useSearchParams } from "react-router-dom";
import { addAnalytics } from "../../../../helpers/analytics";

const useMenuNav = () => {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreview = searchParams.get("preview");
  const selectedItemSlug = searchParams.get("item");
  const selectedCategorySlug = searchParams.get("category");
  const selectedAvailability = searchParams.get("availability");
  const selectedLanguage = searchParams.get("lang");
  const searchText = searchParams.get("search") || "";

  const handleSearchText = (text: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (!text) {
      newSearchParams.delete("search");
      setSearchParams(newSearchParams);
      return;
    }

    addAnalytics(
      "search",
      pathname,
      {
        additionalData: { searchText: text },
      },
      isPreview === "true",
    );

    newSearchParams.set("search", text);
    setSearchParams(newSearchParams);
  };

  const handleSelectLanguage = (language?: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (!language) {
      newSearchParams.delete("lang");
      setSearchParams(newSearchParams);
      return;
    }

    addAnalytics(
      "click",
      pathname,
      {
        additionalData: { language },
      },
      isPreview === "true",
    );

    if (selectedLanguage === language) {
      newSearchParams.delete("lang");
    } else {
      newSearchParams.set("lang", language);
    }
    setSearchParams(newSearchParams);
  };

  const handleSelectItem = (slug?: string, position?: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (!slug) {
      newSearchParams.delete("item");
      setSearchParams(newSearchParams);
      return;
    }

    addAnalytics(
      "click",
      pathname,
      {
        additionalData: { searchText, slug, position },
      },
      isPreview === "true",
    );

    if (selectedItemSlug === slug) {
      newSearchParams.delete("item");
    } else {
      newSearchParams.set("item", slug.toString());
    }
    setSearchParams(newSearchParams);
  };

  const handleSelectCategory = (slug?: string, position?: number) => {
    const newSearchParams = new URLSearchParams(searchParams);

    addAnalytics(
      "click",
      pathname,
      {
        additionalData: { categoryId: slug ? slug : "all", position },
      },
      isPreview === "true",
    );

    if (!slug) {
      newSearchParams.delete("category");
      setSearchParams(newSearchParams);
      return;
    }

    if (selectedCategorySlug === slug) {
      newSearchParams.delete("category");
    } else {
      newSearchParams.set("category", slug);
    }
    setSearchParams(newSearchParams);
  };

  const handleSelectAvailability = (availability?: string, position?: number) => {
    const newSearchParams = new URLSearchParams(searchParams);

    addAnalytics(
      "click",
      pathname,
      {
        additionalData: {
          availability: availability ? availability : "all_day",
          position,
        },
      },
      isPreview === "true",
    );

    // if (!availability) {
    //   newSearchParams.delete("availability");
    //   setSearchParams(newSearchParams);
    //   return;
    // }

    // if (selectedAvailability === availability) {
    //   newSearchParams.delete("availability");
    // } else {
    //   newSearchParams.set("availability", availability);
    // }

    if (selectedAvailability === availability) {
      newSearchParams.set("availability", "all_day");
    } else if (availability) {
      newSearchParams.set("availability", availability);
    }
    setSearchParams(newSearchParams);
  };

  return {
    selectedItemSlug,
    selectedCategorySlug,
    selectedAvailability,
    selectedLanguage,
    searchText,
    handleSelectItem,
    handleSelectCategory,
    handleSelectAvailability,
    handleSelectLanguage,
    handleSearchText,
    isPreview,
  };
};

export default useMenuNav;
