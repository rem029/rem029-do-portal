import { useEffect, useMemo, useState } from "react";
import { useAxios } from "../../../hooks/use-axios";
import { HealthCheck as HealthCheckType } from "../../../types/payload-types";
import moment from "moment";
import { AxiosRequestConfig } from "axios";
import { IoIosRefresh } from "react-icons/io";

export const getDaysDifference = (date: Date): number => {
  const today = moment();
  const targetDate = moment(date);
  return targetDate.diff(today, "days");
};

export interface SSLInfo {
  valid: boolean;
  validFrom: Date;
  validTo: Date;
  validFor: string[];
  status: string;
  daysRemaining: number | "Expired";
}

interface HealthCheckItemProps {
  item: HealthCheckType;
  apiConfig: AxiosRequestConfig;
  showMore?: boolean;
  onSSLDataUpdate?: (itemId: number, sslInfo: SSLInfo) => void;
}

interface HealthCheckStatusResponse {
  url: string;
  status: number;
  text: string;
  sslInfo: SSLInfo;
}

const HealthCheckItem = ({
  item,
  showMore,
  onSSLDataUpdate,
  apiConfig,
}: HealthCheckItemProps) => {
  const config: AxiosRequestConfig = {
    url: `/api/health/status?url=${encodeURIComponent(item.url)}`,
    headers: apiConfig?.headers || {},
  };
  const { data, loading, error, refetch } = useAxios<{ response: any }>({
    config,
    fetchOnLoad: true,
  });

  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const response: HealthCheckStatusResponse = useMemo(() => {
    if (loading || error || !data) {
      return undefined;
    }
    setLastChecked(new Date());
    return data.response;
  }, [loading, error, data]);

  useEffect(() => {
    if (response && onSSLDataUpdate) {
      onSSLDataUpdate(item.id, {
        ...response.sslInfo,
        status: response.text,
        daysRemaining: getDaysRemaining(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const getStatusIndicator = () => {
    if (loading) {
      return <span className="loading loading-spinner loading-xs"></span>;
    }
    if (error) {
      return (
        <span className="text-red-500 font-bold text-sm text-center block">
          Failed
        </span>
      );
    }
    if (response?.text === "OK") {
      return <span className="text-green-500 text-xs text-center block">OK</span>;
    }
    return <span className="text-red-500 text-xs text-center block">Failed</span>;
  };

  const getDaysRemaining = () =>
    response?.sslInfo?.valid
      ? getDaysDifference(response.sslInfo.validTo)
      : "Expired";

  const handleRefetch = () => {
    refetch({ ...config });
  };

  return (
    <tr key={item.id} className="table-row table-xs">
      <td className="table-cell py-1 flex-col">
        <span className="block text-xs">{item?.url}</span>

        {showMore && (
          <>
            {!loading && response ? (
              <>
                <span className="block text-info text-xs">
                  Skip SSL Verification?{" "}
                  {item?.skip_ssl_check === true ? (
                    <strong>Yes</strong>
                  ) : (
                    <strong>No</strong>
                  )}
                </span>
                <span className="block text-info text-xs mt-2">
                  Valid For: {response?.sslInfo?.validFor.join(", ") || "..."}
                </span>
                <span className="block text-info text-xs">
                  Valid From:{" "}
                  {response?.sslInfo?.validFrom
                    ? moment(response.sslInfo.validFrom).format(
                        "MMMM Do YYYY, h:mm:ss a",
                      )
                    : "..."}
                </span>
                <span className="block text-info text-xs">
                  Valid To:{" "}
                  {response?.sslInfo?.validTo
                    ? moment(response.sslInfo.validTo).format(
                        "MMMM Do YYYY, h:mm:ss a",
                      )
                    : "..."}
                </span>

                <span className="block text-info text-xs mt-2">
                  Last Checked:{" "}
                  {response
                    ? moment(lastChecked).format("MMMM Do YYYY, h:mm:ss a")
                    : "..."}
                </span>
              </>
            ) : (
              <span className="loading loading-spinner loading-xs"></span>
            )}
          </>
        )}
      </td>
      <td className="w-full text-center">
        {!loading && response ? (
          <>
            <span className="flex flex-row w-full gap-2 justify-center items-center">
              {getStatusIndicator()}
              <IoIosRefresh
                className={[
                  "cursor-pointer",
                  loading
                    ? "disabled text-opacity-50 text-info"
                    : "text-opacity-100 text-primary",
                ].join(" ")}
                onClick={() => handleRefetch()}
              />
            </span>
          </>
        ) : (
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </td>
      <td className="w-full text-center">
        {!loading && response ? (
          <p className="text-info text-sm">{getDaysRemaining()}</p>
        ) : (
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </td>
    </tr>
  );
};

export default HealthCheckItem;
