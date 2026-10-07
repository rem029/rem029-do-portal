import { lazy } from "react";

const LazyRollerSkatingWaiverPage = lazy(
  () => import("../../components/form/roller-skating-waiver/container"),
);

const RollerSkatingWaiverPage = () => <LazyRollerSkatingWaiverPage />;

export default RollerSkatingWaiverPage;
