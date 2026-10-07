import { useEffect, useState } from "react";
import { Restaurant } from "../types";
import { axiosPayloadClient } from "../utils/config";

const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        setLoading(true);
        const response = await axiosPayloadClient.get(`/api/restaurants`);
        const { data } = response;
        setRestaurants(data?.docs);
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

  return { restaurants, loading, error };
};
export default useRestaurants;
