import { lazy } from "react";

const LazyEmployeeBenefits = lazy(
  () => import("../components/form/employee-benefits"),
);

const EmployeeBenefitsPage = () => <LazyEmployeeBenefits />;

export default EmployeeBenefitsPage;
