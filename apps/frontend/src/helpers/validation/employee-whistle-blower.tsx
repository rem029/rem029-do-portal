import { EmployeeWhistleBlowerV2WithoutId } from "../../types";
import { EmployeeWhistleBlower } from "../../types/payload-types";

const validateEmployeeWhistleBlower = (
  data: EmployeeWhistleBlowerV2WithoutId | EmployeeWhistleBlower,
): Record<string, string> => {
  let response = {};

  // if (!data.subject_info?.department || data.subject_info.department === "") {
  //   response = { ...response, "subject_info.department": "This field is required" };
  // }

  // if (!data.subject_info?.designation || data.subject_info.designation === "") {
  //   response = { ...response, "subject_info.designation": "This field is required" };
  // }

  // if (!data.subject_info?.email || data.subject_info.email === "") {
  //   response = { ...response, "subject_info.email": "This field is required" };
  // }

  // if (!data.subject_info?.name || data.subject_info.name === "") {
  //   response = { ...response, "subject_info.name": "This field is required" };
  // }

  // if (!data.subject_info?.phone || data.subject_info.phone === "") {
  //   response = { ...response, "subject_info.phone": "This field is required" };
  // }

  return response;
};

export default validateEmployeeWhistleBlower;
