import { useEffect, useMemo, useState } from "react";
import {
  HealthCheck as HealthCheckType,
  Media,
  PageContent,
} from "../../../types/payload-types";
import usePayload from "../../../hooks/use-payload";
import { API_SURVEY_URL } from "../../../utils/constants";
import { AxiosRequestConfig } from "axios";
import CustomerSurveyCard from "../../../components/common/card";
import HealthCheckItem, { SSLInfo } from "./health-check-item";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";

interface HealthCheckProps {
  content?: PageContent;
}

type FilterOptions = "show-all" | "show-expired" | "hide-expired";
type Filters = Record<FilterOptions, { value: string; label: string }>;
const filterOptions: Filters = {
  "show-all": { value: "show-all", label: "Show All" },
  "show-expired": { value: "show-expired", label: "Show Expired Only" },
  "hide-expired": { value: "hide-expired", label: "Hide Expired" },
};

const HealthCheck = ({ content }: HealthCheckProps) => {
  const [apiKey, setApiKey] = useState("");
  const [refetchInterval, setRefetchInterval] = useState(3600000); // 1 hour
  const [showKey, setShowKey] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
  const [sslDataMap, setSslDataMap] = useState<Map<number, SSLInfo>>(new Map());
  const [filter, setFilter] = useState<FilterOptions>("show-all");

  const getApiConfig = (): AxiosRequestConfig => {
    return {
      baseURL: API_SURVEY_URL,
      headers: {
        Authorization: apiKey ? `users API-Key ${apiKey}` : undefined,
      },
    };
  };

  const {
    data,
    error,
    loading,
    fetch: refetch,
  } = usePayload<HealthCheckType[]>("collections", {
    slug: "health-check",
    fetchOnLoad: false,
    config: getApiConfig(),
  });

  useEffect(() => {
    const storedApiKey = localStorage.getItem("healthCheckApiKey");
    const storedRefetchInterval = localStorage.getItem("refetchInterval");
    const storedShowConfig = localStorage.getItem("showConfig");
    const storedShowMore = localStorage.getItem("showMore");
    const storedSortAscending = localStorage.getItem("sortAscending");
    // const storedFilter = localStorage.getItem("filter");

    if (storedShowMore) {
      setShowMore(storedShowMore === "true");
    }
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    if (storedRefetchInterval) {
      setRefetchInterval(Number(storedRefetchInterval));
    }
    if (storedShowConfig) {
      setShowConfig(storedShowConfig === "true");
    }
    if (storedSortAscending) {
      setSortAscending(storedSortAscending === "true");
    }
    // if (storedFilter) {
    //   setFilter((storedFilter as FilterOptions) || "show-all");
    // }
  }, []);

  useEffect(() => {
    if (apiKey) {
      refetch(`limit=0&sort=url`, getApiConfig());
      const interval = setInterval(() => {
        refetch(`limit=0&sort=url`, getApiConfig());
      }, refetchInterval);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, refetchInterval]);

  const sortedData = useMemo(() => {
    if (!data) return [];

    const sorted = [...data].sort((a, b) => {
      const aSSL = sslDataMap.get(a.id);
      const bSSL = sslDataMap.get(b.id);

      if (!aSSL && !bSSL) return 0;

      const aDays = aSSL?.daysRemaining;
      const bDays = bSSL?.daysRemaining;

      if (aDays === undefined && bDays === undefined) return 0;
      if (aDays === undefined && bDays !== undefined) return 1;
      if (aDays !== undefined && bDays === undefined) return -1;

      // Handle "Expired" cases based on sort order
      if (sortAscending) {
        // Ascending: expired items come last
        if (aDays === "Expired" && bDays !== "Expired") return 1;
        if (bDays === "Expired" && aDays !== "Expired") return -1;
        if (aDays === "Expired" && bDays === "Expired") return 0;
      } else {
        // Descending: expired items come first
        if (aDays === "Expired" && bDays !== "Expired") return -1;
        if (bDays === "Expired" && aDays !== "Expired") return 1;
        if (aDays === "Expired" && bDays === "Expired") return 0;
      }

      if (typeof aDays === "number" && typeof bDays === "number") {
        return sortAscending ? aDays - bDays : bDays - aDays;
      }

      return 0;
    });

    return sorted.filter((item) => {
      const sslData = sslDataMap.get(item.id);
      const isExpired = sslData?.daysRemaining === "Expired";

      switch (filter) {
        case "show-expired":
          return isExpired;
        case "hide-expired":
          return !isExpired && sslData;
        case "show-all":
        default:
          return true;
      }
    });
  }, [data, sslDataMap, sortAscending, filter]);

  const onSSLDataUpdate = (itemId: number, sslInfo: SSLInfo) => {
    setSslDataMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(itemId, sslInfo);
      return newMap;
    });
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleApiKeySave = () => {
    localStorage.setItem("healthCheckApiKey", apiKey);
    refetch(`limit=0&sort=url`, getApiConfig());
  };

  const handleSortChange = () => {
    setSortAscending(!sortAscending);
    localStorage.setItem("sortAscending", (!sortAscending).toString());
  };

  const handleRefetchIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    localStorage.setItem("refetchInterval", e.target.value);
    setRefetchInterval(Number(e.target.value));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    localStorage.setItem("filter", e.target.value);
    setFilter(e.target.value as FilterOptions);
  };

  const toggleShowConfig = () => {
    setShowConfig(!showConfig);
    localStorage.setItem("showConfig", (!showConfig).toString());
  };

  const toggleShowMore = () => {
    setShowMore(!showMore);
    localStorage.setItem("showMore", (!showMore).toString());
  };

  const logo = content?.dohaoasis?.logo_primary as Media;

  return (
    <div className="font-Poppins w-screen h-screen overflow-x-hidden overflow-y-auto max-md:px-1 px-12 flex flex-col flex-1 items-center relative">
      <div className="w-full max-w-2xl flex flex-col gap-4 max-md:gap-2 mb-8">
        <div className="w-full flex flex-row py-2 justify-between items-center">
          <div className="flex flex-col gap-2">
            <h6 className="flex-1 text-left font-Noah-Regular text-xl font-bold !text-primary gap-2 items-center">
              Health Check
            </h6>
            <p className="flex-1 text-left font-Poppins text-sm !text-info gap-2 items-center">
              Monitor the status of applications and services.
            </p>
          </div>

          <img
            src={logo?.url || ""}
            alt={"dohaoasis-logo"}
            className="aspect w-28"
          />
        </div>

        <CustomerSurveyCard animate bgClassName="bg-gray-50">
          <div className={`flex flex-col gap-2 w-full`}>
            <div
              className={`${
                showConfig ? "" : "hidden"
              } flex flex-1 flex-row items-center px-1 py-0 gap-4`}
            >
              <div className="flex-1">
                <label className="font-Noah-Regular input input-bordered input-sm input-primary flex items-center gap-2">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="Enter API Key"
                    className="grow"
                  />
                  {showKey ? (
                    <FaEye
                      className="text-info text-lg"
                      onClick={() => setShowKey(false)}
                    />
                  ) : (
                    <FaEyeSlash
                      className="text-info text-lg"
                      onClick={() => setShowKey(true)}
                    />
                  )}

                  <div className="label">
                    <span></span>
                    <button
                      onClick={handleApiKeySave}
                      className="link link-xs link-info text-xs"
                    >
                      Save API Key
                    </button>
                  </div>
                </label>
              </div>
            </div>
            <div
              className={`${
                showConfig ? "" : "hidden"
              } flex flex-row items-end px-1 py-0  gap-2`}
            >
              <label className="form-control flex-1 w-ful" htmlFor="refetchInterval">
                <div className="label">
                  <span className="label-text text-info text-xs">Refetch every</span>
                </div>
                <select
                  id="refetchInterval"
                  value={refetchInterval}
                  onChange={handleRefetchIntervalChange}
                  className="select select-sm select-bordered select-primary"
                >
                  <option value={60000}>1 Minute</option>
                  <option value={300000}>5 Minutes</option>
                  <option value={600000}>10 Minutes</option>
                  <option value={1800000}>30 Minutes</option>
                  <option value={3600000}>1 Hour</option>
                </select>
                <div className="label">
                  <span></span>
                  <button
                    onClick={() => refetch(`limit=0&sort=url`, getApiConfig())}
                    className="font-Noah-Regular link link-xs link-info text-xs"
                  >
                    Refetch Now
                  </button>
                </div>
              </label>
            </div>

            <div className="flex flex-row gap-2">
              <div className="form-control">
                <label className="label cursor-pointer gap-4">
                  <span className="label-text text-xs text-info">
                    Show Configuration
                  </span>
                  <input
                    type="checkbox"
                    checked={showConfig}
                    name="showConfig"
                    className="checkbox checkbox-sm checkbox-info"
                    onChange={() => toggleShowConfig()}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer gap-4">
                  <span className="label-text text-xs text-info">Show More</span>
                  <input
                    type="checkbox"
                    checked={showMore}
                    name="showMore"
                    className="checkbox checkbox-sm checkbox-info"
                    onChange={() => toggleShowMore()}
                  />
                </label>
              </div>

              <label className="form-control flex-1 w-ful" htmlFor="filter">
                <select
                  id="filter"
                  value={filter}
                  onChange={handleFilterChange}
                  className="select select-sm select-bordered select-primary"
                >
                  {Object.keys(filterOptions).map((opt, key) => {
                    const filter = filterOptions[opt as FilterOptions];
                    return (
                      <option key={key} value={filter.value}>
                        {filter.label}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
          </div>
        </CustomerSurveyCard>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {sortedData && (
          <CustomerSurveyCard animate bgClassName="bg-gray-50">
            <div className="overflow-x-auto">
              <table className="table table-auto w-full">
                <thead>
                  <tr className="table-row">
                    <th>URL</th>
                    <th className="w-full text-center">Status</th>
                    <th
                      className="w-full text-center cursor-pointer"
                      onClick={handleSortChange}
                    >
                      Days Before Expiry?
                      <FaChevronDown
                        className={`ml-1 inline text-xs transition-transform duration-75 ${
                          sortAscending ? "rotate-180" : ""
                        }`}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData?.map((item: HealthCheckType) => (
                    <HealthCheckItem
                      key={item.id}
                      item={item}
                      showMore={showMore}
                      onSSLDataUpdate={onSSLDataUpdate}
                      apiConfig={getApiConfig()}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CustomerSurveyCard>
        )}
      </div>
    </div>
  );
};

export default HealthCheck;
