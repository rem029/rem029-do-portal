import { AxiosError, AxiosRequestConfig } from "axios";
import { useEffect, useState, useCallback } from "react";
import { axiosPayloadClient } from "../../utils/config";

export const useAxios = <T>({ config, fetchOnLoad }: useAxiosProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T>();
  const [error, setError] = useState<AxiosError | Error>();

  const fetch = useCallback(
    async (configOptions?: AxiosRequestConfig<any>) => {
      try {
        setLoading(true);
        setError(undefined);
        const response = await axiosPayloadClient<T>(
          configOptions ? { ...config, ...configOptions } : config,
        );
        setData(response.data);
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error as AxiosError);
        } else {
          setError(error as Error);
        }
      } finally {
        setLoading(false);
      }
    },
    [config],
  );

  useEffect(() => {
    if (fetchOnLoad) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, data, error, refetch: fetch };
};

interface useAxiosProps {
  config: AxiosRequestConfig<any>;
  fetchOnLoad?: boolean;
}
