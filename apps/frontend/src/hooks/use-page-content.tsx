import { useEffect, useState } from "react";
import { PageContent } from "../types";
import { axiosPayloadClient } from "../utils/config";

const usePageContent = () => {
  const [content, setContent] = useState<PageContent>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        setLoading(true);
        const response = await axiosPayloadClient.get(`/api/globals/page-content`);
        const { data } = response;
        setContent(data);
      } catch (error) {
        const msg = (error as Error)?.message;
        console.error(`Error fetching, ${msg}`);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchPageContent();
  }, []);

  return { content, loading, error };
};
export default usePageContent;
