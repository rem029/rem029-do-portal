import { lazy } from "react";

const LazyPrintepsLoyaltyRegistrationPage = lazy(
  () => import("../../components/form/printemps-loyalty-registration"),
);

const LazyPrintepsLoyaltyRegistration = () => (
  <LazyPrintepsLoyaltyRegistrationPage />
);

export default LazyPrintepsLoyaltyRegistration;
