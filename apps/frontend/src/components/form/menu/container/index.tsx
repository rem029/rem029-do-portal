import { useParams } from "react-router-dom";
import FnbMenu from "..";
import { MenuAllergen, MenuMedia, MenuPage } from "../../../../types/payload-types";
import ErrorPage from "../../../../pages/error";
import LoadingPage from "../../../../pages/loading";
import { useEffect, useMemo } from "react";
import useMenuNav from "../hooks/useMenuNav";
import { useAxios } from "../../../../hooks/use-axios";
import usePayload from "../../../../hooks/use-payload";
import { useMenuStore } from "../store";
import { Helmet } from "react-helmet-async";

const FnbMenuContainer = () => {
  const { slug } = useParams();
  const { selectedLanguage } = useMenuNav();
  const setAllergens = useMenuStore((state) => state.setAllergens);

  const { data, error, loading, refetch } = useAxios<MenuPage>({
    config: {},
    fetchOnLoad: false,
  });

  const {
    data: allergensData,
    loading: allergensLoading,
    error: allergensError,
  } = usePayload<MenuAllergen[]>("collections", {
    slug: "menu-allergens",
    fetchOnLoad: true,
    query: `limit=0&locale=${selectedLanguage || "en"}&draft=false`,
  });

  const page = useMemo(() => {
    if (data) return data;
    return undefined;
  }, [data]);

  useEffect(() => {
    const queries = `${[`locale=${selectedLanguage || "en"}`, "depth=5"].join("&")}`;
    refetch({
      url: `/api/menu-pages/content/${slug}?${queries}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allergensData && !allergensLoading) {
      setAllergens(allergensData.filter((a) => a._status === "published"));
    }
  }, [allergensData, allergensLoading, setAllergens]);

  if (loading || allergensLoading) return <LoadingPage />;
  if (error || allergensError) return <ErrorPage />;
  if (page) {
    const { title, description, image } = page.seo;

    const _title = [title || "Menu", "| Printemps Doha"].join(" ");
    const _description = [
      description || "Restaurant Menu",
      "at Printemps Doha",
    ].join(" ");

    const _image = image ? (image as MenuMedia) : undefined;

    return (
      <>
        <Helmet>
          <title>{_title}</title>
          <meta name="description" content={_description} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <html lang={selectedLanguage || "en"} />

          <meta property="og:type" content="website" />
          <meta property="og:title" content={_title} />
          <meta property="og:description" content={_description} />
          {_image && <meta property="og:image" content={_image?.url || ""} />}
        </Helmet>
        <FnbMenu initialData={page} />
      </>
    );
  }
  return <></>;
};

export default FnbMenuContainer;
