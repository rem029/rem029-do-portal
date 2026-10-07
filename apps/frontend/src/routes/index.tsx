import { RouteObject, createBrowserRouter } from "react-router-dom";
import Root from "../pages/root";
import { WEB_TYPE } from "../utils/constants";
import EmployeeSurveyPage from "../pages/employee-survey";
import ChatPage from "../pages/chat";
import CustomerSurveyPage from "../pages/customer-survey";
import EmployeeBenefitsPage from "../pages/employee-benefits";
import ClubprintempsPage from "../pages/clubprintemps";
import LoginPage from "../pages/login";
import LoginSuccessPage from "../pages/login-success";
import ChatBasePage from "../pages/chatbase";
import IFlyWaiverPage from "../pages/dohaquest/ifly-waiver";
import CustomerSurveyPadelPage from "../pages/customer-survey-padel";
import LaserOasisWaiverPage from "../pages/dohaquest/laser-oasis-waiver";
import EmployeeSurveyManagementPage from "../pages/employee-survey-management";
import { RouterObjectExtended } from "../types";
import ErrorPage from "../pages/error";
import EmployeeWhistleBlowerPageV2 from "../pages/employee-whistle-blower-v2";
import PrintempsLoyaltyRegistrationForm from "../components/form/printemps-loyalty-registration";
import CustomerSatisfactionPage from "../pages/customer-satisfaction";
import EmployeePerks from "../pages/employee-perks";
import DocViewsPage from "../pages/doc-view";
import Menu from "../pages/menu";
import RollerSkatingWaiverPage from "../pages/dohaquest/roller-skating-waiver";
import HealthCheckPage from "../pages/health-check";
import SkiWaiverPage from "../pages/dohaquest/ski-waiver";
import WaiverForms from "../components/form/waiver-forms";

const routes_private: RouterObjectExtended[] = [
  {
    path: "/error",
    element: <ErrorPage />,
  },
  {
    path: "/employee",
    element: <EmployeeSurveyPage />,
  },
  // {
  //   path: "/employee/whistle-blower",
  //   element: <EmployeeWhistleBlowerPage />,
  // },
  {
    path: "/chat",
    element: <ChatBasePage />,
  },
  {
    path: "/chat/old",
    element: <ChatPage />,
  },
  {
    path: "/survey/retail",
    element: <CustomerSurveyPage type="retail" />,
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/login-success", element: <LoginSuccessPage /> },
];
const routes_public: RouterObjectExtended[] = [
  {
    path: "/error",
    element: <ErrorPage />,
  },
  {
    path: "/survey/fnb/:restaurantName",
    element: <CustomerSurveyPage type="fnb" />,
  },
  {
    path: "/survey/fnb",
    element: <CustomerSurveyPage type="fnb" />,
  },
  {
    path: "/survey/satisfaction",
    element: <CustomerSatisfactionPage />,
  },
  {
    path: "/survey/padel",
    element: <CustomerSurveyPadelPage />,
  },
  {
    path: "/employee-benefits",
    element: <EmployeeBenefitsPage />,
  },
  {
    path: "/employee/perks",
    element: <EmployeePerks />,
  },
  {
    path: "/employee/whistle-blower",
    element: <EmployeeWhistleBlowerPageV2 />,
  },
  {
    path: "/clubprintemps",
    element: <ClubprintempsPage />,
  },
  {
    path: "/dohaquest",
    element: <WaiverForms />,
    children: [
      { path: "ifly-waiver", element: <IFlyWaiverPage /> },
      { path: "laser-oasis-waiver", element: <LaserOasisWaiverPage /> },
      {
        path: "roller-skating-waiver",
        element: <RollerSkatingWaiverPage />,
      },
      { path: "ski-waiver", element: <SkiWaiverPage /> },
    ],
  },
  {
    path: "/printemps",
    children: [
      {
        path: "loyalty-registration",
        element: <PrintempsLoyaltyRegistrationForm />,
      },
    ],
  },
  {
    path: "/dohaoasis",
    // children: [{ path: "raffle-974", element: <Raffle974Page /> }],
  },
  { path: "/mgmt", element: <EmployeeSurveyManagementPage /> },
  { path: "/docs/:slug", element: <DocViewsPage /> },
  { path: "/menu/:slug", element: <Menu /> },
  {
    path: "/health-check",
    element: <HealthCheckPage />,
  },
];

const routesObject: Record<string, RouteObject[]> = {
  default: [...routes_private, ...routes_public],
  public: routes_public,
  private: routes_private,
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [...routesObject[WEB_TYPE], { path: "*", element: <ErrorPage /> }],
  },
]);

export default router;
