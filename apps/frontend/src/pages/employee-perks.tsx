import { lazy } from "react";

const LazyFormEmployeePerks = lazy(
  () => import("../components/form/employee-perks"),
);

const EmployeePerks = () => <LazyFormEmployeePerks />;

export default EmployeePerks;
