import { lazy } from "react";

const LazyEmployeeSurvey = lazy(() => import("../components/form/employee-survey"));
const EmployeeSurveyPage = () => <LazyEmployeeSurvey />;

export default EmployeeSurveyPage;
