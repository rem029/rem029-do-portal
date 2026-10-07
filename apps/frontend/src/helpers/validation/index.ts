import {
  EmployeeWhistleBlowerV2WithoutId,
  SurveyCustomerSatisfaction,
} from "../../types";
import { EmployeeWhistleBlower } from "../../types/payload-types";
import validateCustomerSatisfaction, {
  ReturnTypeValidateCustomerSatisfaction,
} from "./ customer-satisfaction";
import validateEmployeeWhistleBlower from "./employee-whistle-blower";

export interface ValidateFieldsType {
  "employee-whistle-blower": EmployeeWhistleBlower;
  "employee-whistle-blower-v2": EmployeeWhistleBlowerV2WithoutId;
  "customer-satisfaction": SurveyCustomerSatisfaction;
}

export interface ValidateFieldsReturnType {
  "employee-whistle-blower": Record<string, string>;
  "employee-whistle-blower-v2": Record<string, string>;
  "customer-satisfaction": ReturnTypeValidateCustomerSatisfaction<SurveyCustomerSatisfaction>;
}

export const validateFields = <T extends keyof ValidateFieldsType>(
  type: T,
  data: ValidateFieldsType[T],
): ValidateFieldsReturnType[T] => {
  if (type === "employee-whistle-blower") {
    const fields = data as EmployeeWhistleBlower;
    return validateEmployeeWhistleBlower(fields);
  }

  if (type === "employee-whistle-blower-v2") {
    const fields = data as EmployeeWhistleBlowerV2WithoutId;
    return validateEmployeeWhistleBlower(fields as EmployeeWhistleBlowerV2WithoutId);
  }

  if (type === "customer-satisfaction") {
    const fields = data as SurveyCustomerSatisfaction;
    return validateCustomerSatisfaction(fields);
  }

  return {};
};
