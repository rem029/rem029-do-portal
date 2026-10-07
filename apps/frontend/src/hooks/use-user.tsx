import { useEffect, useState } from "react";
import { axiosPayloadClient } from "../utils/config";

export interface UserInfo {
  userId: string;
}
const useUserInfo = ({ userId }: UserInfo) => {
  const [userInfo, setUserInfo] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        setLoading(true);
        const response = await axiosPayloadClient.get(`/api/users/${userId}`);
        const { data } = response;
        setUserInfo(data?.docs);
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

  return { userInfo, loading, error };
};
export default useUserInfo;
