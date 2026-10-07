import { lazy } from "react";

const LazyFormCustomerSatisfaction = lazy(
  () => import("../components/form/customer-satisfaction"),
);

const CustomerSatisfactionPage = () => <LazyFormCustomerSatisfaction />;

export default CustomerSatisfactionPage;
