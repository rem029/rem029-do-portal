import { useEffect, useState } from "react";
import { axiosPayloadClient } from "../utils/config";
import { AxiosRequestConfig } from "axios";

const usePayload = <T,>(
  type: "globals" | "collections",
  options: {
    slug: string;
    query?: string;
    fetchOnLoad?: boolean;
    body?: T;
    config?: AxiosRequestConfig;
  },
) => {
  const { fetchOnLoad = true, query, slug } = options;
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fetchOnLoad) fetch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const post = async (
    body: T,
    overrideConfig?: AxiosRequestConfig,
  ): Promise<T | undefined> => {
    try {
      setError(null);
      setData(undefined);
      setLoading(true);
      let url = type === "globals" ? `/api/globals/${slug}` : `/api/${slug}`;
      const response = await axiosPayloadClient.post(
        url,
        body,
        overrideConfig ? overrideConfig : options?.config,
      );
      const { data } = response;
      const responseData = type === "globals" ? data : data?.docs || [];
      setData(responseData);

      return responseData as T;
    } catch (error) {
      const msg = (error as Error)?.message;
      console.error(`Error posting., ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetch = async (
    q?: string,
    overrideConfig?: AxiosRequestConfig,
  ): Promise<T | undefined> => {
    try {
      q = q || query;
      setError(null);
      setData(undefined);
      setLoading(true);
      let url = type === "globals" ? `/api/globals/${slug}` : `/api/${slug}`;
      url += q ? `?${q}` : "";
      const response = await axiosPayloadClient.get(
        url,
        overrideConfig ? overrideConfig : options?.config,
      );
      const { data } = response;
      const responseData = type === "globals" ? data : data?.docs || [];
      setData(responseData);

      return responseData as T;
    } catch (error) {
      const msg = (error as Error)?.message;
      console.error(`Error fetching., ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fetch,
    post,
    clearData: () => setData(undefined),
  };
};
export default usePayload;
