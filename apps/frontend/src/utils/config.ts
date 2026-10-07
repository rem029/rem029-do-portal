import { API_SURVEY_URL, PAYLOAD_API_KEY } from "./constants";
import axios from "axios";

export const axiosPayloadClient = axios.create({
  baseURL: API_SURVEY_URL,
  headers: {
    Authorization: PAYLOAD_API_KEY ? `users API-Key ${PAYLOAD_API_KEY}` : undefined,
  },
});
