import { lazy } from "react";

const LazyFormCustomerSurveyPadel = lazy(
  () => import("../components/form/customer-survey-padel"),
);

const CustomerSurveyPadelPage = () => <LazyFormCustomerSurveyPadel />;

export default CustomerSurveyPadelPage;
