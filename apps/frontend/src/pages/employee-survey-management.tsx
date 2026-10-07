import { lazy } from "react";

const LazyEmployeeSurveyManagement = lazy(
  () => import("../components/form/employee-survey-management"),
);
const EmployeeSurveyManagementPage = () => <LazyEmployeeSurveyManagement />;

export default EmployeeSurveyManagementPage;
