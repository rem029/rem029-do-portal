import { Analytics } from "../types/payload-types";
import { axiosPayloadClient } from "../utils/config";
import { setStorage } from "./localStorage";

export const addAnalytics = async (
  eventType: Analytics["eventType"],
  path: string,
  data?: {
    additionalData?: any;
    elementId?: string;
  },
  skip?: boolean,
) => {
  const { elementId } = data || {};
  const storedData = localStorage.getItem("analytics");
  let storedAnalytics = {};
  let additionalData = data?.additionalData;

  if (skip) return;

  if (additionalData) {
    setStorage("analytics", JSON.stringify(additionalData));
  } else {
    const storedData = localStorage.getItem("analytics");
    if (storedData) {
      additionalData = JSON.parse(storedData);
    }
  }
  try {
    storedAnalytics = storedData ? JSON.parse(storedData) : {};
  } catch (error) {
    console.warn("Failed to parse stored analytics data:", error);
    storedAnalytics = {};
  }

  let mergedAdditionalData = additionalData ? { ...storedAnalytics, ...additionalData } : storedAnalytics;
  setStorage("analytics", JSON.stringify(mergedAdditionalData));

  try {
    await axiosPayloadClient.post("/api/analytics", {
      eventType: eventType,
      path: path,
      referrer: document.referrer || null,
      ipAddress: null,
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id: -1,
      elementId,
      additionalData: mergedAdditionalData,
    });
  } catch (error) {
    console.error("Failed to post analytics:", error);
  }
};
