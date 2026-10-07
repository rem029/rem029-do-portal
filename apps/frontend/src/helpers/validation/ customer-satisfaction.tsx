import { SurveyCustomerSatisfaction } from "../../types/payload-types";

export type ReturnTypeValidateCustomerSatisfaction<T> = Partial<Record<keyof T, string>>;

const validateCustomerSatisfaction = <T extends SurveyCustomerSatisfaction>(
  data: T,
): ReturnTypeValidateCustomerSatisfaction<T> => {
  let response: ReturnTypeValidateCustomerSatisfaction<T> = {};

  let requiredFields: Array<keyof T> = [
    "store_ambience_cleanliness_rating",
    "is_product_availability_variety",
    "product_availability_variety_rating",
    "store_ambience_visual_presentation_rating",
    "rating_customer_service",
    "is_customer_service_helpful",
    "checkout_payment_process",
    "loyalty_program",
    "communication_promotions",
    "rating_overall_experience",
    "name",
    "telephone_number_country",
    "telephone_number",
  ];

  if (data?.loyalty_program === "Yes") {
    requiredFields = [...requiredFields, "rating_loyalty_program_satis"];
  }

  for (const key of requiredFields) {
    const isEmpty = !data[key] || data[key] === "";

    if (isEmpty) {
      response = { ...response, [key]: "This field is required" };
    }
  }

  return response;
};

export default validateCustomerSatisfaction;
