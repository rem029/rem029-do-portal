import { lazy } from "react";

const LazyFormCustomerSurvey = lazy(
  () => import("../components/form/customer-survey"),
);

const CustomerSurveyPage = ({ type }: CustomerSurveyPageProps) => (
  <LazyFormCustomerSurvey type={type} />
);

interface CustomerSurveyPageProps {
  type: "fnb" | "retail";
}

export default CustomerSurveyPage;
