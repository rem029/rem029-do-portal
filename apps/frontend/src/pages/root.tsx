import { Outlet, useLocation, useParams } from "react-router-dom";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { getPageConfig } from "../helpers";
import Header from "../components/header";
import { Helmet } from "react-helmet-async";
import LoadingPage from "./loading";
import { axiosPayloadClient } from "../utils/config";
import { Media, PageContent, Restaurant } from "../types";

function Root() {
  const { pathname } = useLocation();
  const params = useParams();

  const [restaurantInfo, setRestaurantInfo] = useState<Restaurant>();
  const [pageContents, setPageContents] = useState<PageContent>();

  const header = useMemo(() => {
    const { header: label, headerFont, hideHeader } = getPageConfig(pathname);

    document.title = label ? `Doha Oasis | ${label}` : "Doha Oasis";

    return { label, headerFont, hideHeader };
  }, [pathname]);

  const content = useMemo(() => {
    const { theme } = getPageConfig(pathname);

    document.querySelector("html")?.setAttribute("data-theme", theme);

    if (!pageContents) {
      return {};
    }

    switch (theme) {
      case "dohaoasis":
        return pageContents.dohaoasis;
      case "dohaoasis-alt":
        return pageContents.dohaoasis;
      case "dohaoasis-new":
        return pageContents.dohaoasis;
      case "dohaquest":
        return pageContents.dohaquest;
      case "printemps":
        return pageContents.printemps;
      default:
        return {};
    }
  }, [pageContents, pathname]);

  const descriptipn = useMemo(() => {
    if (pathname.includes("survey/fnb") || pathname.includes("survey/retail"))
      return "Share Your Dining Experience to Help Us Serve You Better!";

    return "";
  }, [pathname]);

  const restaurantName = useMemo(() => {
    if (!pathname.includes("survey/fnb")) return "";

    let restaurantName = params.restaurantName ? params.restaurantName : "";
    restaurantName = restaurantName === "Please choose" ? "" : restaurantName;

    return restaurantName ? restaurantName : "";
  }, [pathname, params]);

  const dynamicScripts = useMemo(() => {
    if (!restaurantInfo || !restaurantInfo.scripts) return [];

    return restaurantInfo.scripts.map((script, index) => {
      switch (script.type) {
        case "external": {
          return (
            <script
              key={"script_" + index}
              src={script?.src || ""}
              async={script.async || undefined}
              defer={script.defer || undefined}
            ></script>
          );
        }

        case "inline":
          return (
            <script key={"script_" + index} type="text/javascript">
              {script.content}
            </script>
          );

        default:
          return <React.Fragment key={"script_" + index}></React.Fragment>;
      }
    });
  }, [restaurantInfo]);

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      try {
        const response = await axiosPayloadClient.get(
          `/api/restaurants?[where][slug][equals]=${textToSlugFormat(
            restaurantName,
          )}`,
        );
        const { data } = response;
        if (!data.docs || data.docs?.length === 0) return;
        setRestaurantInfo(data.docs[0]);
      } catch (error) {
        console.error(`Error fetching, ${(error as Error)?.message}`);
      }
    };

    if (restaurantName) {
      fetchRestaurantInfo();
    }
  }, [restaurantName]);

  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        const response = await axiosPayloadClient.get(`/api/globals/page-content`);
        const { data } = response;
        setPageContents(data);
      } catch (error) {
        console.error(`Error fetching, ${(error as Error)?.message}`);
      }
    };

    fetchPageContent();
  }, []);

  return (
    <div className="w-full max-h-screen flex flex-col items-center justify-start bg-neutral overflow-x-hidden overflow-y-auto">
      <Helmet>
        <link rel="icon" href={(content.favicon as Media)?.url || ""} />
        {dynamicScripts}
        <meta name="msapplication-TileColor" content="#00aba9" />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#78716c" />
        <meta name="description" content={descriptipn} />

        <meta name="robots" content="noindex"></meta>
        <meta name="googlebot" content="noindex,nofollow" />
        <title>
          {header
            ? `Doha Oasis | ${header.label} ${
                restaurantName ? `| ${restaurantName}` : ""
              }`
            : "Doha Oasis"}
        </title>
      </Helmet>
      <div className="w-full min-h-screen flex flex-col items-center justify-start">
        <Suspense fallback={<LoadingPage />}>
          {!header.hideHeader && (
            <Header
              logo={{
                primary: (content.logo_primary as Media)?.url || "",
                secondary: (content.logo_secondary as Media)?.url || "",
              }}
            />
          )}
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

export default Root;

const textToSlugFormat = (text: string) => text?.toLowerCase().replaceAll(" ", "-");
