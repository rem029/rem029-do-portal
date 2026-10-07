import { lazy } from "react";

const LazyFormEmployeeWhistleBlowerV2 = lazy(
  () => import("../components/form/employee-whistle-blower-v2"),
);

const EmployeeWhistleBlowerPageV2 = () => <LazyFormEmployeeWhistleBlowerV2 />;

export default EmployeeWhistleBlowerPageV2;
